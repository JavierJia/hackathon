package actors

import akka.actor.{Actor, ActorLogging}
import models._
import org.joda.time.{DateTime, Interval}
import org.joda.time.format.DateTimeFormat
import play.api.libs.json._
import services.AsterixConnection

import scala.concurrent.ExecutionContext

class DBActor(val conn: AsterixConnection)(implicit ec: ExecutionContext) extends Actor with ActorLogging {

  import DBActor._

  override def receive: Receive = {
    case query: MapQuery =>
      query.queryType match {
        case QueryType.Signal =>
          val aql = generateSignalMapAQL(query)
          val curSender = sender()
          conn.post(aql).map {
            response =>
              val jsons = Json.parse("[ " + response.body.replaceAll(" \\]\n\\[", " \\],\n\\[") + " ] ").asInstanceOf[JsArray]
              curSender ! packageResult("Signal", "map", query.scale, jsons.value(0))
              curSender ! packageResult("Signal", "time", query.scale, jsons.value(1))
          }
        case QueryType.AppUsage =>
          val aql = generateAppUsageAQL(query)
          val curSender = sender()
          conn.post(aql).map {
            response =>
              val jsons = Json.parse("[ " + response.body.replaceAll(" \\]\n\\[", " \\],\n\\[") + " ] ").asInstanceOf[JsArray]
              curSender ! packageResult("AppUsage", "map", query.scale, jsons.value(0))
              curSender ! packageResult("AppUsage", "time", query.scale, jsons.value(1))
          }
      }


  }
}

object DBActor {
  val Dataverse = "hackathon"
  val SignalDataSet = "sigcube"
  val SignalTimeField = "start_time"
  val CDMA = "cdma"
  val EVDO = "evdo"
  val GSM = "gsm"
  val LTE = "lte"
  val WCDMA = "wcdma"
  val AllCarrier = Seq(CDMA, EVDO, GSM, LTE, WCDMA)

  val AppUsageDataSet = "sig_app"
  val AppUsageTimeField = "app_start_time"
  val AppUsageLocationField = "location"
  val AppUsageGeoField = "geo_tag"

  import models.Formatter._

  def packageResult(queryType: String, dimension: String, scale: MapTimeScale, results: JsValue): JsObject = {
    JsObject(Seq(
      "type" -> JsString(queryType),
      "dimension" -> JsString(dimension),
      "scale" -> Json.toJson(scale),
      "results" -> results).toMap
    )
  }

  def strength(cate: String) = s"${cate}_dbm"

  def quality(cate: String) = s"${cate}_asu_level"

  def count(cate: String) = s"${cate}_count"

  def pairAggr(cate: String) =
    s"""
       |"$cate" : {
       |          "strength" : sum(for $$x in $$t return $$x.${strength(cate)}) / (1+sum(for $$x in $$t return $$x.${count(cate)})),
       |          "quality": sum(for $$x in $$t return $$x.${quality(cate)}) / (1+sum(for $$x in $$t return $$x.${count(cate)}))
       |          }
     """.stripMargin

  val TimeFormat = DateTimeFormat.forPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")

  def getPredicate(timeField: String, interval: Interval) =
    s"""
       |($$t.$timeField >= datetime("${TimeFormat.print(interval.getStart)}")
       |and $$t.$timeField < datetime("${TimeFormat.print(interval.getEnd)}"))
       |""".stripMargin

  def geoField(scale: MapTimeScale) = scale.spatial match {
    case Boro => "boro_id"
    case Neighbor => "nid"
  }

  def generateSignalMapAQL(query: MapQuery): String = {
    val predicate = getPredicate(SignalTimeField, query.time)


    val common =
      s"""
         |let $$common := (
         |  for $$t in dataset $SignalDataSet
         |  where $predicate
         |  return $$t
         |)
         |""".stripMargin
    val byTime =
      s"""print-datetime($$t.$SignalTimeField, "YYYY-MM-DD hh")""".stripMargin

    s"""
       |use dataverse $Dataverse
       |
       |$common
       |for $$t in $$common
       |group by $$c:=$$t.${geoField(query.scale)} with $$t
       |return {
       |  "key": string($$c),
       |  "summary": {
       |  ${AllCarrier.map(pairAggr).mkString(",")}
       |  }
       |};
       |
       |$common
       |for $$t in $$common
       |group by $$c:= $byTime with $$t
       |return {
       |  "key": $$c,
       |  "summary": {
       |  ${AllCarrier.map(pairAggr).mkString(",")}
       |  }
       |}
       |
         """.stripMargin

  }

  def generateAppUsageAQL(query: MapQuery): String = {
    val predicate = getPredicate(AppUsageTimeField, query.time)
    val common =
      s"""
         |let $$common := (
         |  for $$t in dataset $AppUsageDataSet
         |  where $predicate
         |  return $$t
         |)
         |""".stripMargin
    val geoField = query.scale.spatial match {
      case Boro => "boroCode"
      case Neighbor => "neighborID"
    }
    val byTime =
      s"""print-datetime($$t.$AppUsageTimeField, "YYYY-MM-DD hh")""".stripMargin

    val timeCommon =
      s"""
         |let $$apps := [ "Chrome Browser - Google", "Facebook", "Gmail", "Google Play Store", "Maps",
         |               "Instagram", "YouTube", "WhatsApp Messenger", "Messenger", "Snapchat" ]
         |let $$common := (
         |  for $$t in dataset $AppUsageDataSet
         |  where $predicate
         |  for $$app in $$apps
         |  where $$t.app_name = $$app
         |  return $$t
         |)
         |""".stripMargin

    def grpby(i: Int): String = {
      val apps = Seq("Chrome Browser - Google", "Facebook", "Gmail", "Google Play Store", "Maps",
                     "Instagram", "YouTube", "WhatsApp Messenger", "Messenger", "Snapchat")
      s"""
         | "${apps(i)}": {
         |        "b" : count( for $$x in $$t
         |              where $$x.app_name = "${apps(i)}" and $$x.app_usage_type = 4 return $$x),
         |        "f" : count( for $$x in $$t
         |              where $$x.app_name = "${apps(i)}" and $$x.app_usage_type = 5 return $$x)
         |              }
         |""".stripMargin
    }

    s"""
       |use dataverse $Dataverse
       |
       |$common
       |for $$t in $$common
       |group by $$c := $$t.$AppUsageGeoField.$geoField with $$t
       |return {
       |  "key" : $$c,
       |  "summary": {
       |    "b" :
       |          ( for $$x in $$t
       |                where $$x.app_usage_type = 4
       |                group by $$app:= $$x.app_name, $$icon := $$x.icon with $$x
       |                let $$count := count($$x)
       |                order by $$count desc
       |                limit 1
       |                return {
       |                  "app": $$app,
       |                  "icon": $$icon,
       |                  "count": $$count
       |                }
       |           )[0],
       |    "f" : ( for $$x in $$t
       |                where $$x.app_usage_type = 5
       |                group by $$app:= $$x.app_name, $$icon := $$x.icon with $$x
       |                let $$count := count($$x)
       |                order by $$count desc
       |                limit 1
       |                return {
       |                  "app": $$app,
       |                  "icon": $$icon,
       |                  "count": $$count
       |                }
       |           )[0]
       |  }
       |}
       |
       |$timeCommon
       |for $$t in $$common
       |group by $$c := $byTime with $$t
       |return {
       |  "key" : $$c,
       |  "summary" : {
       |    ${Seq(0, 1, 2, 3, 4, 5, 6, 7, 8, 9).map(grpby).mkString(",")}
       |  }
       |}
       |
       |
       |""".stripMargin
  }

}
