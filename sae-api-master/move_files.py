import os
import shutil

src_base = r"C:\taskforce_01\sae-fullstack\sae-api-master\sae-common\src\main\java\codelab\api\smart\sae"
dest_base = r"C:\taskforce_01\sae-fullstack\sae-api-master\sae-auth-service\src\main\java\codelab\api\smart\sae"

dirs_to_move = [
    (r"user\model", r"user\model"),
    (r"user\repository", r"user\repository")
]

for src, dest in dirs_to_move:
    src_path = os.path.join(src_base, src)
    dest_path = os.path.join(dest_base, dest)
    if os.path.exists(src_path):
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.move(src_path, dest_path)
        print(f"Moved {src_path} to {dest_path}")

# Move CustomUserDetailsService
src_file = os.path.join(src_base, r"framework\security\CustomUserDetailsService.java")
dest_file = os.path.join(dest_base, r"framework\security\CustomUserDetailsService.java")
if os.path.exists(src_file):
    os.makedirs(os.path.dirname(dest_file), exist_ok=True)
    shutil.move(src_file, dest_file)
    print(f"Moved {src_file} to {dest_file}")
