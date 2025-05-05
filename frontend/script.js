const API_URL = 'http://localhost:8000';
let currentBoardId = null;

// Function to fetch and display boards
async function loadBoards() {
    const response = await fetch(`${API_URL}/boards/`, {
        headers: {
            'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
        }
    });
    const boards = await response.json();
    const boardSelect = document.getElementById('boardSelect');
    boardSelect.innerHTML = '<option value="">Выберите доску</option>'; // Clear existing options

    boards.forEach(board => {
        const option = document.createElement('option');
        option.value = board.id;
        option.textContent = board.name;
        boardSelect.appendChild(option);
    });

    boardSelect.addEventListener('change', () => {
        currentBoardId = boardSelect.value;
        if (currentBoardId) {
            loadProjects(currentBoardId);
        } else {
            // Clear the board if no board is selected
            document.getElementById('board').innerHTML = '';
        }
    });
}

// Function to load and display projects for a board
async function loadProjects(boardId) {
    const response = await fetch(`${API_URL}/boards/${boardId}/projects/`, {
        headers: {
            'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
        }
    });
    const projects = await response.json();
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = ''; // Clear existing projects

    projects.forEach(project => {
        const projectElement = document.createElement('div');
        projectElement.classList.add('project');
        projectElement.innerHTML = `
            <h2>${project.name}</h2>
            <ul id="project-${project.id}" class="task-list"></ul>
            <button onclick="openCreateTaskModal(${boardId}, ${project.id})">Добавить Задачу</button>
        `;
        boardElement.appendChild(projectElement);
        loadTasks(boardId, project.id);
    });

    // Add a button to create a new project
    const createProjectButton = document.createElement('button');
    createProjectButton.textContent = 'Создать Проект';
    createProjectButton.onclick = () => openCreateProjectModal(boardId);
    boardElement.appendChild(createProjectButton);
}

// Function to load and display tasks for a project
async function loadTasks(boardId, projectId) {
    const response = await fetch(`${API_URL}/boards/${boardId}/projects/${projectId}/tasks/`, {
        headers: {
            'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
        }
    });
    const tasks = await response.json();
    const taskList = document.getElementById(`project-${projectId}`);
    taskList.innerHTML = ''; // Clear existing tasks

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = `${task.title} (${task.priority})`;
        li.classList.add(`priority-${task.priority}`);
        taskList.appendChild(li);
    });

    // Initialize SortableJS for this task list
    new Sortable(taskList, {
        group: 'tasks',
        onUpdate: function (evt) {
            // Handle task reordering (call API to update task's project_id)
            console.log('Task reordered:', evt.item, evt.newIndex);
        }
    });
}

// Function to create a new board
async function createBoard() {
    const newBoardName = document.getElementById('newBoardName').value;
    const response = await fetch(`${API_URL}/boards/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
        },
        body: JSON.stringify({ name: newBoardName })
    });
    loadBoards(); // Refresh board list
    closeCreateBoardModal(); // Close the modal
}

// Function to create a new project
async function createProject() {
    const newProjectName = document.getElementById('newProjectName').value;
    const newProjectDescription = document.getElementById('newProjectDescription').value;
    const response = await fetch(`${API_URL}/projects/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
        },
        body: JSON.stringify({ name: newProjectName, description: newProjectDescription, board_id: currentBoardId })
    });
    loadProjects(currentBoardId); // Refresh project list
    closeCreateProjectModal(); // Close the modal
}

// Function to create a new task
async function createTask(boardId, projectId) {
    const newTaskName = document.getElementById('newTaskName').value;
    const newTaskDescription = document.getElementById('newTaskDescription').value;
    const newTaskPriority = document.getElementById('newTaskPriority').value;

    const response = await fetch(`${API_URL}/projects/${projectId}/tasks/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
        },
        body: JSON.stringify({ title: newTaskName, description: newTaskDescription, priority: newTaskPriority })
    });
    loadTasks(boardId, projectId); // Refresh task list
    closeCreateTaskModal(); // Close the modal
}

// Modal control functions
function openCreateBoardModal() {
    document.getElementById('createBoardModal').style.display = 'block';
}

function closeCreateBoardModal() {
    document.getElementById('createBoardModal').style.display = 'none';
}

function openCreateProjectModal(boardId) {
    currentBoardId = boardId;
    document.getElementById('createProjectModal').style.display = 'block';
}

function closeCreateProjectModal() {
    document.getElementById('createProjectModal').style.display = 'none';
}

function openCreateTaskModal(boardId, projectId) {
    currentBoardId = boardId;
    currentProjectId = projectId
    document.getElementById('createTaskModal').style.display = 'block';
}

function closeCreateTaskModal() {
    document.getElementById('createTaskModal').style.display = 'none';
}

// Load boards on page load
loadBoards();