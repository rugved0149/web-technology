#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <iomanip>
#include <algorithm>

using namespace std;

struct Inode {
    int id;
    string name;
    string data;
    bool used = false;
    vector<int> blocks;
};

class SimpleFileSystem {
    vector<Inode> inodes;
    vector<int> allocationTable;
    int nextId = 1;
    const int blockSize = 16;

    int findFile(const string& name) {
        for (int i = 0; i < (int)inodes.size(); ++i)
            if (inodes[i].used && inodes[i].name == name) return i;
        return -1;
    }

    vector<int> allocateBlocks(int count) {
        vector<int> result;
        for (int i = 0; i < (int)allocationTable.size() && (int)result.size() < count; ++i)
            if (allocationTable[i] == -1) result.push_back(i);

        if ((int)result.size() != count) return {};
        for (int block : result) allocationTable[block] = nextId;
        return result;
    }

    void releaseBlocks(const vector<int>& blocks) {
        for (int block : blocks) allocationTable[block] = -1;
    }

public:
    SimpleFileSystem(int inodeCount, int blockCount)
        : inodes(inodeCount), allocationTable(blockCount, -1) {}

    void createFile(const string& name, const string& data) {
        if (name.empty() || findFile(name) != -1) {
            cout << "Invalid name or file already exists.\n";
            return;
        }

        int slot = -1;
        for (int i = 0; i < (int)inodes.size(); ++i)
            if (!inodes[i].used) { slot = i; break; }

        if (slot == -1) {
            cout << "No free inode available.\n";
            return;
        }

        int required = max(1, (int)(data.size() + blockSize - 1) / blockSize);
        vector<int> blocks = allocateBlocks(required);
        if (blocks.empty()) {
            cout << "Not enough free disk blocks.\n";
            return;
        }

        inodes[slot] = {nextId, name, data, true, blocks};
        ++nextId;
        cout << "File created. Inode ID: " << inodes[slot].id << '\n';
    }

    void readFile(const string& name) {
        int index = findFile(name);
        if (index == -1) cout << "File not found.\n";
        else cout << "Contents: " << inodes[index].data << '\n';
    }

    void writeFile(const string& name, const string& data) {
        int index = findFile(name);
        if (index == -1) {
            cout << "File not found.\n";
            return;
        }

        int required = max(1, (int)(data.size() + blockSize - 1) / blockSize);
        vector<int> blocks = allocateBlocks(required);
        if (blocks.empty()) {
            cout << "Not enough free blocks to safely replace file contents.\n";
            return;
        }

        releaseBlocks(inodes[index].blocks);
        for (int block : blocks) allocationTable[block] = inodes[index].id;
        inodes[index].blocks = blocks;
        inodes[index].data = data;
        cout << "File updated.\n";
    }

    void deleteFile(const string& name) {
        int index = findFile(name);
        if (index == -1) {
            cout << "File not found.\n";
            return;
        }
        releaseBlocks(inodes[index].blocks);
        inodes[index] = Inode{};
        cout << "File deleted and blocks released.\n";
    }

    void listFiles() {
        cout << "\nName\tInode\tAllocated blocks\n";
        for (const auto& file : inodes) {
            if (!file.used) continue;
            cout << file.name << '\t' << file.id << '\t';
            for (int block : file.blocks) cout << block << ' ';
            cout << '\n';
        }
    }
};

int main() {
    SimpleFileSystem fs(10, 32);
    int choice;
    string name, data;

    do {
        cout << "\n1.Create  2.Read  3.Write  4.Delete  5.List  0.Exit\nChoice: ";
        cin >> choice;
        cin.ignore();

        if (choice >= 1 && choice <= 4) {
            cout << "File name: ";
            getline(cin, name);
        }

        switch (choice) {
            case 1:
                cout << "File contents: ";
                getline(cin, data);
                fs.createFile(name, data);
                break;
            case 2:
                fs.readFile(name);
                break;
            case 3:
                cout << "New contents: ";
                getline(cin, data);
                fs.writeFile(name, data);
                break;
            case 4:
                fs.deleteFile(name);
                break;
            case 5:
                fs.listFiles();
                break;
            case 0:
                cout << "Exiting file system.\n";
                break;
            default:
                cout << "Invalid choice.\n";
        }
    } while (choice != 0);
    return 0;
}