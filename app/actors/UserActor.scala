package actors

import akka.actor.{Actor, ActorLogging, ActorRef, Props}
import akka.event.LoggingReceive
import akka.util.Timeout
import models.{QueryResult, MapQuery}
import play.api.libs.json._

import scala.concurrent.duration._

/**
  * Each user is an actor.
  */
class UserActor(val out: ActorRef, val dbActor: ActorRef) extends Actor with ActorLogging {

  import models.Formatter._
  def receive() = LoggingReceive {
    case json: JsValue => {
      val query = parseQuery(json)
      // why tell instead of ask? because we want to send the query continuously.
      // The ask model is answered once, the rest of responds will be send to dead letter unless we send the out to msg
      log.info("query is:" + query)
      dbActor.tell(query, out)
    }
    case other =>
  }

  def parseQuery(json: JsValue) = json.as[MapQuery]
}

object UserActor {

  implicit val timeout = Timeout(15.seconds)

  def props(out: ActorRef, dbActor: ActorRef) = Props(new UserActor(out, dbActor))

}

