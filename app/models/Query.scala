package models

import org.joda.time.Interval

object QueryType extends Enumeration {
  type QueryType = Value
  val Signal, AppUsage = Value
}

case class MapTimeScale(spatial: ChoroplethScale, time: TimeScale)

case class MapQuery(queryType: QueryType.Value, scale: MapTimeScale, area: Rectangle, time: Interval)

case class Rectangle(swLog: Double, swLat: Double, neLog: Double, neLat: Double)

