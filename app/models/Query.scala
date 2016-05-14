package models

import org.joda.time.Interval
import play.api.libs.json.Json

object QueryType extends Enumeration {
  val Signal, AppUsage = Value
}

case class UserQuery(userType: QueryType.Value, area: Rectangle, time: Interval)

case class DBQuery(aql: String)

case class Rectangle(swLog: Double, swLat: Double, neLog: Double, neLat: Double)

object Rectangle {
  implicit val rectangularFormat = Json.format[Rectangle]
}
