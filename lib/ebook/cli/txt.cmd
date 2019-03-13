@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f txt -o %dir% -i %1 