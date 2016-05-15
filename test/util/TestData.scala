package util

import models._
import org.joda.time.{DateTime, Interval}

trait TestData {
  val rectangle = Rectangle(-148.00, 1.5, -100.9, 25.5)
  val interval = new Interval(new DateTime(2015, 9, 1, 0, 0), new DateTime(2015, 12, 31, 0, 0))
  val scale = new MapTimeScale(Boro, Hour)
  val signalQuery = SignalQuery(QueryType.Signal, scale, rectangle, interval)
}
