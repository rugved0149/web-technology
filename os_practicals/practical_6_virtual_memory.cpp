#include <iostream>
#include <vector>
#include <algorithm>
#include <unordered_map>

using namespace std;

int fifo(const vector<int>& pages, int capacity) {
    vector<int> frames;
    int faults = 0, next = 0;
    for (int page : pages) {
        if (find(frames.begin(), frames.end(), page) != frames.end()) continue;
        ++faults;
        if ((int)frames.size() < capacity) frames.push_back(page);
        else {
            frames[next] = page;
            next = (next + 1) % capacity;
        }
    }
    return faults;
}

int lru(const vector<int>& pages, int capacity) {
    vector<int> frames, lastUsed;
    int faults = 0;
    for (int i = 0; i < (int)pages.size(); ++i) {
        int page = pages[i];
        auto it = find(frames.begin(), frames.end(), page);
        if (it != frames.end()) {
            lastUsed[it - frames.begin()] = i;
        } else {
            ++faults;
            if ((int)frames.size() < capacity) {
                frames.push_back(page);
                lastUsed.push_back(i);
            } else {
                int pos = min_element(lastUsed.begin(), lastUsed.end()) - lastUsed.begin();
                frames[pos] = page;
                lastUsed[pos] = i;
            }
        }
    }
    return faults;
}

int optimal(const vector<int>& pages, int capacity) {
    vector<int> frames;
    int faults = 0;
    for (int i = 0; i < (int)pages.size(); ++i) {
        int page = pages[i];
        if (find(frames.begin(), frames.end(), page) != frames.end()) continue;
        ++faults;
        if ((int)frames.size() < capacity) {
            frames.push_back(page);
            continue;
        }

        int replace = -1, farthest = -1;
        for (int j = 0; j < (int)frames.size(); ++j) {
            int nextUse = (int)pages.size();
            for (int k = i + 1; k < (int)pages.size(); ++k)
                if (pages[k] == frames[j]) {
                    nextUse = k;
                    break;
                }
            if (nextUse > farthest) {
                farthest = nextUse;
                replace = j;
            }
        }
        frames[replace] = page;
    }
    return faults;
}

int main() {
    int n, capacity;
    cout << "Enter number of page references: ";
    cin >> n;
    if (n <= 0) return 0;

    vector<int> pages(n);
    cout << "Enter page reference string: ";
    for (int& page : pages) cin >> page;

    cout << "Enter number of frames: ";
    cin >> capacity;
    if (capacity <= 0) return 1;

    cout << "\nPage faults\n";
    cout << "FIFO    : " << fifo(pages, capacity) << '\n';
    cout << "LRU     : " << lru(pages, capacity) << '\n';
    cout << "Optimal : " << optimal(pages, capacity) << '\n';
    return 0;
}