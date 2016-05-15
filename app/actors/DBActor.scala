package actors

import akka.actor.{Actor, ActorLogging}
import models._
import org.joda.time.format.DateTimeFormat
import play.api.libs.json.{JsArray, JsString, Json}
import services.AsterixConnection

import scala.concurrent.ExecutionContext
import scala.util.parsing.json.JSONObject

class DBActor(val conn: AsterixConnection)(implicit ec: ExecutionContext) extends Actor with ActorLogging {

  import DBActor._

  import models.Formatter._
  override def receive: Receive = {
    case query: SignalQuery =>
      val aql = generateSignalAQL(query)
      val curSender = sender()
      conn.post(aql).map {
        response =>
          val jsons = Json.parse(response.body.replaceAll(" \\]\n\\[", " ,\n")).asInstanceOf[JsArray]
          curSender ! JSONObject(Seq(
            "type" -> JsString("Signal"),
            "dimension" -> JsString("map"),
            "scale" -> Json.toJson(query.scale),
            "results" -> jsons.value(0)).toMap
          )
          curSender ! JSONObject(Seq(
            "type" -> JsString("Signal"),
            "dimension" -> JsString("time"),
            "scale" -> Json.toJson(query.scale),
            "results" -> jsons.value(1)).toMap
          )
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

  def strength(cate: String) = s"${cate}_dbm"

  def quality(cate: String) = s"${cate}_asu_level"

  def count(cate: String) = s"${cate}_count"

  def pairAggr(cate: String) =
    s"""
       |"$cate" : {
       |          "strength" : sum(for $$x in $$t return $$x.${strength(cate)}) / sum(for $$x in $$t return $$x.${count(cate)})
       |          "quality": sum(for $$x in $$t return $$x.${quality(cate)}) / sum(for $$x in $$t return $$x.${count(cate)}
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
    query.queryType match {
      case QueryType.Signal =>
        s"""
           |use dataverse $Dataverse
           |let $$common = (
           |  for $$t in dataset $SignalDataSet
           |  where $predicate
           |)
           |
           |for $$t in $$common
           |group by $$c:=$$t.$geoField with $$t
           |return {
           |  "key": string($$c),
           |  "summary": {
           |  ${AllCarrier.map(pairAggr).mkString(",")}
           |  }
           |}
           |
           |for $$t in $$common
           |group by $$c:=$$t.$TimeField with $$t
           |return {
           |  "key": string($$c),
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
