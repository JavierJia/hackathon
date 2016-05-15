package models

class QueryResult

case class SignalSummary(carrier: String, strength: Double, quality: Double)

case class KeySummary(key: String, summary: Seq[SignalSummary])

case class SignalResult(queryType: QueryType.Value, dimension: String, results: Seq[KeySummary]) extends QueryResult

