name := """hackathon"""

version := "1.0-SNAPSHOT"

lazy val root = (project in file(".")).enablePlugins(PlayScala)

scalaVersion := "2.11.7"

val testDeps = Seq(
  specs2 % Test,
  "org.specs2" %% "specs2-matcher-extra" % "3.6" % Test,
  "org.easytesting" % "fest-assert" % "1.4" % Test,
  "com.typesafe.akka" %% "akka-testkit" % "2.3.11" % Test
)


libraryDependencies ++= Seq(
  jdbc,
  cache,
  ws,
  "com.vividsolutions" % "jts" % "1.13",
  "org.wololo" % "jts2geojson" % "0.7.0"
) ++ testDeps

resolvers += "scalaz-bintray" at "http://dl.bintray.com/scalaz/releases"
