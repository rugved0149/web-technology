#include <iostream>
#include <vector>
#include <algorithm>
#include <iomanip>
#include <climits>

using namespace std;

struct Process {
    int id, arrival, burst, remaining, completion, waiting, turnaround;
};

void printResults(vector<Process> p, const string& name) {
    double totalWT = 0, totalTAT = 0;
    cout << "\n" << name << "\n";
    cout << "PID\tAT\tBT\tCT\tTAT\tWT\n";
    for (const auto& x : p) {
        cout << x.id << '\t' << x.arrival << '\t' << x.burst << '\t'
             << x.completion << '\t' << x.turnaround << '\t' << x.waiting << '\n';
        totalWT += x.waiting;
        totalTAT += x.turnaround;
    }
    cout << fixed << setprecision(2);
    cout << "Average waiting time: " << totalWT / p.size() << '\n';
    cout << "Average turnaround time: " << totalTAT / p.size() << '\n';
}

void fcfs(vector<Process> p) {
    sort(p.begin(), p.end(), [](auto a, auto b) {
        return a.arrival == b.arrival ? a.id < b.id : a.arrival < b.arrival;
    });
    int time = 0;
    for (auto& x : p) {
        time = max(time, x.arrival) + x.burst;
        x.completion = time;
        x.turnaround = time - x.arrival;
        x.waiting = x.turnaround - x.burst;
    }
    printResults(p, "FCFS Scheduling");
}

void sjf(vector<Process> p) {
    int n = p.size(), completed = 0, time = 0;
    vector<bool> done(n, false);
    while (completed < n) {
        int chosen = -1;
        for (int i = 0; i < n; ++i)
            if (!done[i] && p[i].arrival <= time &&
                (chosen == -1 || p[i].burst < p[chosen].burst))
                chosen = i;

        if (chosen == -1) {
            int nextArrival = INT_MAX;
            for (int i = 0; i < n; ++i)
                if (!done[i]) nextArrival = min(nextArrival, p[i].arrival);
            time = nextArrival;
            continue;
        }

        time += p[chosen].burst;
        p[chosen].completion = time;
        p[chosen].turnaround = time - p[chosen].arrival;
        p[chosen].waiting = p[chosen].turnaround - p[chosen].burst;
        done[chosen] = true;
        ++completed;
    }
    printResults(p, "Non-preemptive SJF Scheduling");
}

void roundRobin(vector<Process> p, int quantum) {
    sort(p.begin(), p.end(), [](auto a, auto b) {
        return a.arrival == b.arrival ? a.id < b.id : a.arrival < b.arrival;
    });
    int n = p.size(), time = 0, completed = 0, next = 0;
    vector<int> queue;
    while (completed < n) {
        if (queue.empty() && next < n && time < p[next].arrival)
            time = p[next].arrival;
        while (next < n && p[next].arrival <= time) queue.push_back(next++);
        if (queue.empty()) continue;

        int i = queue.front();
        queue.erase(queue.begin());
        int run = min(quantum, p[i].remaining);
        time += run;
        p[i].remaining -= run;
        while (next < n && p[next].arrival <= time) queue.push_back(next++);
        if (p[i].remaining > 0) queue.push_back(i);
        else {
            p[i].completion = time;
            p[i].turnaround = time - p[i].arrival;
            p[i].waiting = p[i].turnaround - p[i].burst;
            ++completed;
        }
    }
    printResults(p, "Round Robin Scheduling");
}

int main() {
    int n;
    cout << "Enter number of processes: ";
    cin >> n;
    if (n <= 0) return 0;

    vector<Process> p(n);
    for (int i = 0; i < n; ++i) {
        p[i].id = i + 1;
        cout << "Enter arrival time and burst time for P" << i + 1 << ": ";
        cin >> p[i].arrival >> p[i].burst;
        if (p[i].arrival < 0 || p[i].burst <= 0) {
            cout << "Arrival time must be >= 0 and burst time > 0.\n";
            return 1;
        }
        p[i].remaining = p[i].burst;
    }

    int quantum;
    cout << "Enter Round Robin time quantum: ";
    cin >> quantum;
    if (quantum <= 0) return 1;

    fcfs(p);
    sjf(p);
    roundRobin(p, quantum);
    return 0;
}