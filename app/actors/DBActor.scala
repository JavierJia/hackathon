package actors

import akka.actor.Actor.Receive
import akka.actor.{Actor, ActorLogging}
import services.AsterixConnection

class DBActor(val conn: AsterixConnection) extends Actor with ActorLogging {
  override def receive: Receive = ???
}
