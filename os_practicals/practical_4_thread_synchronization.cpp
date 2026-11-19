#include <iostream>
#include <thread>
#include <mutex>
#include <condition_variable>
#include <queue>
#include <semaphore.h>
#include <chrono>

using namespace std;

queue<int> buffer;
const int CAPACITY = 5;
mutex mtx;
condition_variable notFull, notEmpty;
sem_t producerSlots;

void producer() {
    for (int item = 1; item <= 10; ++item) {
        sem_wait(&producerSlots);
        {
            unique_lock<mutex> lock(mtx);
            notFull.wait(lock, [] { return buffer.size() < CAPACITY; });
            buffer.push(item);
            cout << "Produced: " << item << '\n';
        }
        notEmpty.notify_one();
        this_thread::sleep_for(chrono::milliseconds(100));
    }
}

void consumer() {
    for (int i = 1; i <= 10; ++i) {
        int item;
        {
            unique_lock<mutex> lock(mtx);
            notEmpty.wait(lock, [] { return !buffer.empty(); });
            item = buffer.front();
            buffer.pop();
            cout << "Consumed: " << item << '\n';
        }
        notFull.notify_one();
        sem_post(&producerSlots);
        this_thread::sleep_for(chrono::milliseconds(150));
    }
}

int main() {
    if (sem_init(&producerSlots, 0, CAPACITY) != 0) {
        perror("sem_init");
        return 1;
    }

    thread p(producer);
    thread c(consumer);
    p.join();
    c.join();

    sem_destroy(&producerSlots);
    cout << "Producer-consumer execution completed.\n";
    return 0;
}