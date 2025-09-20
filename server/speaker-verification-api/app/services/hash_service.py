# services/hash_service.py
import hashlib

def compute_file_hashes(file_path: str):
    """Compute SHA256 and MD5 hashes for a given file."""
    sha256_hash = hashlib.sha256()
    md5_hash = hashlib.md5()

    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha256_hash.update(chunk)
            md5_hash.update(chunk)

    return {
        "hash_sha256": sha256_hash.hexdigest(),
        "hash_md5": md5_hash.hexdigest(),
    }
