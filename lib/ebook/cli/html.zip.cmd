@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f html.zip -o %dir% -i %1 