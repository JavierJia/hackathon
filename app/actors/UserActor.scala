package actors

import akka.actor.{Actor, ActorLogging, ActorRef, Props}
import akka.event.LoggingReceive
import akka.util.Timeout
import models.{QueryResult, UserQuery}
import play.api.libs.json._

import scala.concurrent.duration._

/**
  * Each user is an actor.
  */
class UserActor(val out: ActorRef, val dbActor: ActorRef) extends Actor with ActorLogging {

  def receive() = LoggingReceive {
    case json: JsValue => {
      val query = parseQuery(json)
      // why tell instead of ask? because we want to send the query continuously.
      // The ask model is answered once, the rest of responds will be send to dead letter unless we send the out to msg
      log.info("query is:" + query)
      if (true) {
        dbActor ! query
      } else {
        out ! Json.obj("aggType" -> "error", "errorMessage" -> "no spatial area covered in this area")
      }
    }
    case result: QueryResult =>
      out ! Json.toJson(result)
    case other =>
  }

  def parseQuery(json: JsValue) = ???

}

object UserActor {

  implicit val timeout = Timeout(15.seconds)

  def props(out: ActorRef, dbActor: ActorRef) = Props(new UserActor(out, dbActor))

}

