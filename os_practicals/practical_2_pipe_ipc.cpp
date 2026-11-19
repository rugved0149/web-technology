#include <iostream>
#include <unistd.h>
#include <sys/wait.h>
#include <cstring>

using namespace std;

int main() {
    int fd[2];
    if (pipe(fd) == -1) {
        perror("pipe");
        return 1;
    }

    pid_t pid = fork();
    if (pid < 0) {
        perror("fork");
        return 1;
    }

    if (pid == 0) {
        close(fd[1]);
        char buffer[100] {};
        ssize_t bytes = read(fd[0], buffer, sizeof(buffer) - 1);
        if (bytes < 0) {
            perror("read");
            return 1;
        }
        buffer[bytes] = '\0';
        cout << "Child process received: " << buffer << '\n';
        close(fd[0]);
    } else {
        close(fd[0]);
        const char message[] = "Hello from the parent process";
        cout << "Parent process (PID " << getpid() << ") sends a message.\n";
        if (write(fd[1], message, strlen(message)) < 0) {
            perror("write");
            return 1;
        }
        close(fd[1]);
        waitpid(pid, nullptr, 0);
        cout << "Child process terminated. Parent process ends.\n";
    }
    return 0;
}