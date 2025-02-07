/**
 * Represents a track action that is triggered at specific track states
 */
export class Action {
    /**
     * @param {Object} actionStartState - State which triggers action start
     * @param {number} actionStartState.i - Section index
     * @param {number} actionStartState.j - Timebox index
     * @param {number} actionStartState.k - Position index
     * @param {number} actionId - Unique identifier for this action
     */
    constructor(actionStartState, actionId) {
        if (!this.validateState(actionStartState)) {
            throw new Error('Invalid action start state format');
        }
        if (!Number.isInteger(actionId) || actionId < 1) {
            throw new Error('Action ID must be a positive integer');
        }

        this.actionStartState = {
            i: actionStartState.i,
            j: actionStartState.j,
            k: actionStartState.k
        };
        this.actionId = actionId;
    }

    /**
     * Validates state object format
     * @param {Object} state - State to validate
     * @returns {boolean} True if state is valid
     */
    validateState(state) {
        return state &&
            Number.isInteger(state.i) && state.i >= 0 &&
            Number.isInteger(state.j) && state.j >= 0 &&
            Number.isInteger(state.k) && state.k >= 0;
    }

    /**
     * Checks if a given track state matches this action's start state
     * @param {Object} currentState - Current track state to check
     * @returns {boolean} True if states match
     */
    matchesState(currentState) {
        return currentState &&
            currentState.i === this.actionStartState.i &&
            currentState.j === this.actionStartState.j &&
            currentState.k === this.actionStartState.k;
    }

    /**
     * Creates a string representation of the action
     * @returns {string} String representation
     */
    toString() {
        const {i, j, k} = this.actionStartState;
        return `Action ${this.actionId} @ (${i},${j},${k})`;
    }

    /**
     * Creates an Action instance from a plain object
     * @param {Object} obj - Plain object with action data
     * @returns {Action} New Action instance
     */
    static fromObject(obj) {
        if (!obj.actionStartState || !obj.actionId) {
            throw new Error('Invalid action object format');
        }
        return new Action(obj.actionStartState, obj.actionId);
    }

    /**
     * Converts action to a plain object for serialization
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            actionStartState: { ...this.actionStartState },
            actionId: this.actionId
        };
    }
}

/**
 * Collection of track actions with management functionality
 */
export class ActionManager {
    constructor() {
        this.actions = new Map();
    }

    /**
     * Adds a new action to the collection
     * @param {Action} action - Action to add
     */
    addAction(action) {
        if (this.actions.has(action.actionId)) {
            throw new Error(`Action with ID ${action.actionId} already exists`);
        }
        this.actions.set(action.actionId, action);
    }

    /**
     * Gets all actions that should trigger for a given state
     * @param {Object} currentState - Current track state
     * @returns {Action[]} Array of matching actions
     */
    getMatchingActions(currentState) {
        return Array.from(this.actions.values())
            .filter(action => action.matchesState(currentState));
    }

    /**
     * Removes an action by ID
     * @param {number} actionId - ID of action to remove
     * @returns {boolean} True if action was removed
     */
    removeAction(actionId) {
        return this.actions.delete(actionId);
    }

    /**
     * Gets all actions as an array
     * @returns {Action[]} Array of all actions
     */
    getAllActions() {
        return Array.from(this.actions.values());
    }

    /**
     * Converts all actions to plain objects for serialization
     * @returns {Object[]} Array of action objects
     */
    toJSON() {
        return this.getAllActions().map(action => action.toObject());
    }

    /**
     * Creates an ActionManager instance from serialized data
     * @param {Object[]} data - Array of action objects
     * @returns {ActionManager} New ActionManager instance
     */
    static fromJSON(data) {
        const manager = new ActionManager();
        data.forEach(actionData => {
            const action = Action.fromObject(actionData);
            manager.addAction(action);
        });
        return manager;
    }
} 