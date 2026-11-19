#include <iostream>
#include <iomanip>
#include <sys/statvfs.h>
#include <string>

using namespace std;

int main() {
    string path;
    cout << "Enter filesystem path (use / for the root filesystem): ";
    cin >> path;

    struct statvfs info {};
    if (statvfs(path.c_str(), &info) != 0) {
        perror("statvfs");
        return 1;
    }

    unsigned long long total = 1ULL * info.f_blocks * info.f_frsize;
    unsigned long long available = 1ULL * info.f_bavail * info.f_frsize;
    unsigned long long freeSpace = 1ULL * info.f_bfree * info.f_frsize;
    unsigned long long used = total - freeSpace;

    const double gb = 1024.0 * 1024 * 1024;
    double percentage = total ? (100.0 * used / total) : 0.0;

    cout << fixed << setprecision(2);
    cout << "\nFilesystem: " << path << '\n';
    cout << "Total space     : " << total / gb << " GB\n";
    cout << "Used space      : " << used / gb << " GB\n";
    cout << "Available space : " << available / gb << " GB\n";
    cout << "Usage            : " << percentage << "%\n";
    return 0;
}