package controllers

import javax.inject._

import actors.{DBActor, UserActor}
import akka.actor.{ActorSystem, Props}
import akka.stream.Materializer
import play.api._
import play.api.libs.json.JsValue
import play.api.libs.streams.ActorFlow
import play.api.libs.ws.WSClient
import play.api.mvc._
import services.AsterixConnection

import scala.concurrent.ExecutionContext.Implicits.global

/**
  * This controller creates an `Action` to handle HTTP requests to the
  * application's home page.
  */
@Singleton
class HomeController @Inject()(val wsClient: WSClient,
                               val config: Configuration,
                               val environment: Environment,
                               implicit val system: ActorSystem,
                               implicit val materializer: Materializer
                              ) extends Controller {

  val AsterixURL = config.getString("asterixdb.url").get
  val asterixConn = new AsterixConnection(wsClient, AsterixURL)
  val dbActor = system.actorOf(Props(new DBActor(asterixConn)))

  /**
    * Create an Action to render an HTML page with a welcome message.
    * The configuration in the `routes` file means that this method
    * will be called when the application receives a `GET` request with
    * a path of `/`.
    */
  def index = Action {
    Ok(views.html.index("Your new application is ready."))
  }

  def app = Action {
    Ok(views.html.app("AppUsage"))
  }

  def ws = WebSocket.accept[JsValue, JsValue] {
    request =>
      ActorFlow.actorRef(out => UserActor.props(out, dbActor))
  }

}
