package models

import org.joda.time.{DateTime, Interval}
import org.specs2.mutable.Specification
import play.api.libs.json.{JsNumber, JsObject, JsString}
import util.TestData

class SignalQueryTest extends Specification with TestData{

  import models.Formatter._
  "A signal format " should {
    "convert between json and object" in {
      val signalQueryJson = JsObject(Seq(
        "queryType" -> JsString("Signal"),
        "scale" -> JsObject(Seq(
          "map" -> JsString("boro"),
          "time" -> JsString("hour")
        )),
        "area" -> JsObject(Seq(
          "swLog" -> JsNumber(rectangle.swLog),
          "swLat" -> JsNumber(rectangle.swLat),
          "neLog" -> JsNumber(rectangle.neLog),
          "neLat" -> JsNumber(rectangle.neLat)
        )),
        "time" -> JsObject(Seq(
          "start" -> JsNumber(interval.getStart.getMillis),
          "end" -> JsNumber(interval.getEnd.getMillis)
        ))
      ))
      signalQueryJson.as[SignalQuery] must_== signalQuery
    }
  }
}
