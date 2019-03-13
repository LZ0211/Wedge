@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f txts.zip -o %dir% -i %1 