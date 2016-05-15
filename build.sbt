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
  "org.scalatestplus.play" %% "scalatestplus-play" % "1.5.1" % Test,
  "org.webjars" % "bootstrap" % "3.3.6",
  "org.webjars" % "angularjs" % "1.5.0",
  // map dependencies
  "org.webjars" % "leaflet" % "0.7.7",
  "org.webjars" % "angular-leaflet-directive" % "0.8.2",
  // timeseries module
  "org.webjars.bower" % "crossfilter" % "1.3.11",
  "org.webjars.bower" % "dc.js" % "1.7.5",
  "org.webjars" % "d3js" % "3.5.16",
  "com.vividsolutions" % "jts" % "1.13",
  "org.wololo" % "jts2geojson" % "0.7.0"
) ++ testDeps

resolvers += "scalaz-bintray" at "http://dl.bintray.com/scalaz/releases"
