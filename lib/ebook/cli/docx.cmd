@ECHO OFF
SET dir=%cd%
pushd %~dp0
node cli -f docx -o %dir% -i %1 