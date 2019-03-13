@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f wbk -o %dir% -i %1 