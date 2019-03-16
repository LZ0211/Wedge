@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f chm -o %dir% -i %1