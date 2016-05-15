package util

import org.mockito.Mockito._
import org.mockito.invocation.InvocationOnMock
import org.mockito.stubbing.Answer
import org.specs2.mock.Mockito
import play.api.Play
import play.api.libs.json.{JsArray, JsValue}
import play.api.libs.ws.WSResponse
import play.api.mvc.{Action, _}
import play.api.routing.sird._
import play.api.test.WsTestClient
import play.core.server.Server
import services.AsterixConnection

import scala.concurrent.{ExecutionContext, Future}

object TestUtil {
  /**
    * @param block
    * @tparam T
    * @return
    */
  def withAsterixConn[T](expectedResponse: JsValue)(block: AsterixConnection => T)(implicit ec: ExecutionContext): T = {
    Server.withRouter() {
      //* this mock server can't write the request, we can not let the result based on the request
      case POST(p"/aql") => Action {
        Results.Ok(expectedResponse)
      }
    } { implicit port =>
      implicit val materializer = Play.current.materializer
      WsTestClient.withClient { client =>
        block(new AsterixConnection(client, "/aql"))
      }
    }
  }


}

trait MockConnClient extends Mockito {

  def withLightWeightConn[T](expectedResponse: JsValue)(block: AsterixConnection => T)(implicit ec: ExecutionContext): T = {
    val mockConn = mock[AsterixConnection]
    val mockResponse = mock[WSResponse]
    mockResponse.status returns (200)
    mockResponse.json returns (expectedResponse)
    when(mockConn.post(any[String])).thenAnswer(new Answer[Future[WSResponse]] {
      override def answer(invocation: InvocationOnMock): Future[WSResponse] = {
        println(invocation.getArguments.head.asInstanceOf[String])
        Future(mockResponse)
      }
    })
    block(mockConn)
  }

  def withAsterixBugConn[T](multipleResults: JsArray)(block: AsterixConnection => T)(implicit ec: ExecutionContext): T = {
    val mockConn = mock[AsterixConnection]
    val mockResponse = mock[WSResponse]
    mockResponse.status returns (200)
    mockResponse.body returns (multipleResults.value.map("[ " + _.toString() + "\n ]").mkString("\n"))
    when(mockConn.post(any[String])).thenAnswer(new Answer[Future[WSResponse]] {
      override def answer(invocation: InvocationOnMock): Future[WSResponse] = {
        println(invocation.getArguments.head.asInstanceOf[String])
        Future(mockResponse)
      }
    })
    block(mockConn)
  }

}
