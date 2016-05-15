package actors

import akka.actor.{Actor, ActorLogging}
import models._
import org.joda.time.format.DateTimeFormat
import play.api.libs.json._
import services.AsterixConnection

import scala.concurrent.ExecutionContext
import scala.util.parsing.json.JSONObject

class DBActor(val conn: AsterixConnection)(implicit ec: ExecutionContext) extends Actor with ActorLogging {

  import DBActor._

  override def receive: Receive = {
    case query: SignalQuery =>
      val aql = generateSignalAQL(query)
      val curSender = sender()
      conn.post(aql).map {
        response =>
          val jsons = Json.parse("[ " +  response.body.replaceAll(" \\]\n\\[", " \\],\n\\[") + " ] ").asInstanceOf[JsArray]
          curSender ! packageResult("map", query.scale, jsons.value(0))
          curSender ! packageResult("time", query.scale, jsons.value(1))
      }
  }
}

object DBActor {
  val Dataverse = "hackathon"
  val SignalDataSet = "sigcube"
  val TimeField = "start_time"
  val CDMA = "cdma"
  val EVDO = "evdo"
  val GSM = "gsm"
  val LTE = "lte"
  val WCDMA = "wcdma"
  val AllCarrier = Seq(CDMA, EVDO, GSM, LTE, WCDMA)

  import models.Formatter._
  def packageResult(dimension: String, scale: MapTimeScale, results: JsValue): JsObject = {
    JsObject(Seq(
      "type" -> JsString("Signal"),
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

  def generateSignalAQL(query: SignalQuery): String = {
    val predicate =
      s"""
         |($$t.$TimeField >= datetime("${TimeFormat.print(query.time.getStart)}")
         |and $$t.$TimeField < datetime("${TimeFormat.print(query.time.getEnd)}"))
         |""".stripMargin

    val geoField = query.scale.spatial match {
      case Boro => "boro_id"
      case Neighbor => "nid"
    }
    val common =
      s"""
         |let $$common := (
         |  for $$t in dataset $SignalDataSet
         |  where $predicate
         |  return $$t
         |)
         |""".stripMargin
    val byTime =
      s"""print-datetime($$t.$TimeField, "YYYY-MM-DD hh")""".stripMargin

    query.queryType match {
      case QueryType.Signal =>
        s"""
           |use dataverse $Dataverse
           |
           |$common
           |for $$t in $$common
           |group by $$c:=$$t.$geoField with $$t
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
      case QueryType.AppUsage => ???
    }
  }

}
