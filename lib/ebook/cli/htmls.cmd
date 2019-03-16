@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f txts -o %dir% -i %1 