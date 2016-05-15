package services

import play.api.libs.ws.{WSClient, WSResponse}
import util.Logging

import scala.concurrent.duration.Duration
import scala.concurrent.{ExecutionContext, Future}

class AsterixConnection(wSClient: WSClient, url: String)(implicit ec: ExecutionContext) extends Logging {

  def post(aql: String): Future[WSResponse] = {
    log.info("AQL:" + aql)
    val f = wSClient.url(url).withRequestTimeout(Duration.Inf).post(aql)
    f.onFailure(failureHandler(aql))
    f
  }

  protected def failureHandler(aql: String): PartialFunction[Throwable, Unit] = {
    case e: Throwable => log.error("WS Error:" + aql, e); throw e
  }
}