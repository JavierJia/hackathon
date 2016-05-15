package actors

import org.specs2.mutable.Specification
import util.TestData

class DBActorTest extends Specification with TestData {

  "DBActor" should {
    "generate a valid aql" in {
      val aql = DBActor.generateSignalAQL(signalQuery)
      println(aql)
      ok
    }
  }
}
