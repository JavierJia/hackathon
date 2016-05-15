package models

import org.joda.time.Interval

object QueryType extends Enumeration {
  type QueryType = Value
  val Signal, AppUsage = Value
}

case class SpatialTimeScale(spatial: ChoroplethScale, time: TimeScale)

case class SignalQuery(queryType: QueryType.Value, scale: SpatialTimeScale, area: Rectangle, time: Interval)

case class Rectangle(swLog: Double, swLat: Double, neLog: Double, neLat: Double)

