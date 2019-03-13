@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f ebook -o %dir% -i %1 