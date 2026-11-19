# Operating Systems Practicals — C++

Seven C++ implementations based on the MITAOE Operating Systems practical list.

## Programs

| Practical | Implementation |
|---|---|
| 1 | Filesystem disk usage using statvfs |
| 2 | Process creation and parent-child communication using fork() and pipe() |
| 3 | FCFS, non-preemptive SJF and Round Robin CPU scheduling |
| 4 | Producer-consumer synchronization using semaphore, mutex and condition variable |
| 5 | Banker's safety algorithm with safe resource increase/decrease checks |
| 6 | Demand-paging simulation with FIFO, LRU and Optimal replacement |
| 7 | In-memory file-system simulation using inodes and a block allocation table |

## Requirements

Use Linux, Ubuntu or WSL with g++ installed. Practical 1 and 2 use POSIX/Linux system calls. Practical 4 uses POSIX semaphores and C++ threads.

## Compile

Run from this directory:

    g++ -std=c++17 practical_1_disk_usage.cpp -o practical1
    g++ -std=c++17 practical_2_pipe_ipc.cpp -o practical2
    g++ -std=c++17 practical_3_cpu_scheduling.cpp -o practical3
    g++ -std=c++17 practical_4_thread_synchronization.cpp -pthread -o practical4
    g++ -std=c++17 practical_5_bankers_algorithm.cpp -o practical5
    g++ -std=c++17 practical_6_virtual_memory.cpp -o practical6
    g++ -std=c++17 practical_7_simple_file_system.cpp -o practical7

Run any program with ./practical1 through ./practical7.

The file-system practical is an educational in-memory simulation; it does not modify the host operating system's real filesystem. The Banker's algorithm practical validates the resource change against the safety algorithm using the supplied allocation, maximum and available matrices.
