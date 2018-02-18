@ECHO OFF
pushd %~dp0
node cli -f docx -i %1 -o %~dp0