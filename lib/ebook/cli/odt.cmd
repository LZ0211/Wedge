@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f odt -o %dir% -i %1 