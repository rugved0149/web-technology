#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

bool safeState(const vector<vector<int>>& allocation,
               const vector<vector<int>>& maximum,
               const vector<int>& available) {
    int n = allocation.size(), m = available.size();
    vector<int> work = available;
    vector<bool> finished(n, false);
    int count = 0;

    while (count < n) {
        bool found = false;
        for (int i = 0; i < n; ++i) {
            if (finished[i]) continue;
            bool canFinish = true;
            for (int j = 0; j < m; ++j)
                if (maximum[i][j] - allocation[i][j] > work[j])
                    canFinish = false;

            if (canFinish) {
                for (int j = 0; j < m; ++j) work[j] += allocation[i][j];
                finished[i] = true;
                ++count;
                found = true;
            }
        }
        if (!found) return false;
    }
    return true;
}

int main() {
    int n, m;
    cout << "Enter number of processes and resource types: ";
    cin >> n >> m;
    if (n <= 0 || m <= 0) return 1;

    vector<vector<int>> allocation(n, vector<int>(m));
    vector<vector<int>> maximum(n, vector<int>(m));
    vector<int> available(m);

    cout << "Enter Allocation matrix:\n";
    for (auto& row : allocation)
        for (int& x : row) cin >> x;

    cout << "Enter Maximum matrix:\n";
    for (auto& row : maximum)
        for (int& x : row) cin >> x;

    cout << "Enter Available resources:\n";
    for (int& x : available) cin >> x;

    for (int i = 0; i < n; ++i)
        for (int j = 0; j < m; ++j)
            if (allocation[i][j] < 0 || maximum[i][j] < allocation[i][j]) {
                cout << "Invalid allocation or maximum claim.\n";
                return 1;
            }

    if (!safeState(allocation, maximum, available)) {
        cout << "Initial state is unsafe. Check the input.\n";
        return 1;
    }

    int choice, resource, amount;
    cout << "\n1. Increase Available resources\n2. Decrease Available resources\nChoice: ";
    cin >> choice;
    cout << "Enter resource index (1 to " << m << ") and amount: ";
    cin >> resource >> amount;
    --resource;

    if (resource < 0 || resource >= m || amount <= 0) {
        cout << "Invalid resource index or amount.\n";
        return 1;
    }

    vector<int> updated = available;
    if (choice == 1) {
        updated[resource] += amount;
    } else if (choice == 2) {
        if (amount > updated[resource]) {
            cout << "Cannot remove more resources than are currently available.\n";
            return 0;
        }
        updated[resource] -= amount;
    } else {
        cout << "Invalid choice.\n";
        return 1;
    }

    if (safeState(allocation, maximum, updated)) {
        cout << "Change can be applied safely.\n";
        cout << "Updated Available vector: ";
        for (int x : updated) cout << x << ' ';
        cout << '\n';
    } else {
        cout << "Change rejected: it would leave the system in an unsafe state.\n";
    }
    return 0;
}