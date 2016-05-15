package actors

import org.specs2.mutable.Specification
import play.api.libs.json.{JsArray, Json}
import util.TestData

class DBActorTest extends Specification with TestData {

  "DBActor" should {
    "generate a valid aql" in {
      val aql = DBActor.generateMapAQL(signalQuery)
      println(aql)
      ok
    }
    "test aql query" in {

      val aql = DBActor.generateMapAQL(signalQuery)
      val response =
        s"""[ { "key": "6", "summary": { "cdma": { "strength": -89.40292, "quality": 4.7844253 }, "evdo": { "strength": -98.960556, "quality": 4.982318 }, "gsm": { "strength": -98.77333, "quality": 7.1337366 }, "lte": { "strength": -1.9509822E7, "quality": -1.7567206E7 }, "wcdma": { "strength": 0.0, "quality": 0.0 } } }
, { "key": "8", "summary": { "cdma": { "strength": -87.28301, "quality": 5.697301 }, "evdo": { "strength": -100.330734, "quality": 7.0229216 }, "gsm": { "strength": -91.06472, "quality": 11.016333 }, "lte": { "strength": -1.26148496E8, "quality": -1.11713352E8 }, "wcdma": { "strength": 0.0, "quality": 0.0 } } }
, { "key": "7", "summary": { "cdma": { "strength": -89.25753, "quality": 6.5807476 }, "evdo": { "strength": -105.67937, "quality": 6.863491 }, "gsm": { "strength": -83.94588, "quality": 14.655374 }, "lte": { "strength": -4.5493004E7, "quality": -3.1048124E7 }, "wcdma": { "strength": 0.0, "quality": 0.0 } } }
 ]
[ { "key": "2015-09-01 00", "summary": { "cdma": { "strength": -85.226105, "quality": 7.2323985 }, "evdo": { "strength": -88.7363, "quality": 7.127193 }, "gsm": { "strength": -95.749016, "quality": 8.647832 }, "lte": { "strength": -2.25307136E8, "quality": -2.12004704E8 }, "wcdma": { "strength": 0.0, "quality": 0.0 } } }
, { "key": "2015-09-01 01", "summary": { "cdma": { "strength": -83.415794, "quality": 7.333043 }, "evdo": { "strength": -95.11507, "quality": 10.286799 }, "gsm": { "strength": -95.16503, "quality": 8.923135 }, "lte": { "strength": -7.4733408E7, "quality": -7.4733264E7 }, "wcdma": { "strength": 0.0, "quality": 0.0 } } }
, { "key": "2015-09-01 02", "summary": { "cdma": { "strength": -84.30615, "quality": 7.317272 }, "evdo": { "strength": -93.94389, "quality": 9.957386 }, "gsm": { "strength": -96.23902, "quality": 8.218536 }, "lte": { "strength": -1.02161944E8, "quality": -1.02161792E8 }, "wcdma": { "strength": 0.0, "quality": 0.0 } } } ]"""

      val jsons = Json.parse("[ " + response.replaceAll(" \\]\n\\[", " \\],\n\\[") + " ] ").asInstanceOf[JsArray]
      println(Json.prettyPrint(DBActor.packageResult("map", signalQuery.scale, jsons.value(0))))
      println(Json.prettyPrint(DBActor.packageResult("time", signalQuery.scale, jsons.value(1))))

      ok
    }
  }
}
