@echo off
set SRC_COMMON=C:\taskforce_01\sae-fullstack\sae-api-master\sae-common\src\main\java\codelab\api\smart\sae
set DEST_AUTH=C:\taskforce_01\sae-fullstack\sae-api-master\sae-auth-service\src\main\java\codelab\api\smart\sae

echo Moving model...
move "%SRC_COMMON%\user\model" "%DEST_AUTH%\user\"

echo Moving repository...
move "%SRC_COMMON%\user\repository" "%DEST_AUTH%\user\"

echo Moving CustomUserDetailsService...
mkdir "%DEST_AUTH%\framework\security"
move "%SRC_COMMON%\framework\security\CustomUserDetailsService.java" "%DEST_AUTH%\framework\security\"

echo Done.
