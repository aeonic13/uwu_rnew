// Stable Roommates Algorithm - STUDENT ONLY FEATURE
// Implementation of Robert Irving's algorithm for stable roommate pairing
// Ensures optimal matches where no two people would prefer each other over their assigned roommates

export class StableRoommatesAlgorithm {
  constructor(students) {
    // Security check - only students can access this feature
    if (students.some(student => student.userType === 'owner')) {
      throw new Error('Roommate matching is only available for students');
    }
    
    this.students = students;
    this.preferences = {};
    this.ranks = {};
    this.proposals = {};
    this.suitors = {};
    this.reducedLists = {};
  }

  // Generate preference lists based on compatibility scores
  generatePreferences() {
    this.students.forEach(student => {
      // Calculate compatibility with all other students
      const otherStudents = this.students.filter(other => other.id !== student.id);
      const compatibilityScores = otherStudents.map(other => ({
        student: other,
        score: this.calculateCompatibilityScore(student, other)
      }));
      
      // Sort by compatibility score (highest first)
      compatibilityScores.sort((a, b) => b.score - a.score);
      
      // Create preference list
      this.preferences[student.id] = compatibilityScores.map(item => item.student.id);
      this.reducedLists[student.id] = [...this.preferences[student.id]];
      
      // Create rank lookup for O(1) preference comparison
      this.ranks[student.id] = {};
      this.preferences[student.id].forEach((otherId, index) => {
        this.ranks[student.id][otherId] = index;
      });
      
      // Initialize suitors list
      this.suitors[student.id] = [];
    });
  }

  // Phase 1: Proposal Phase
  proposalPhase() {
    // Initialize free queue with all students
    const freeQueue = [...this.students.map(s => s.id)];
    const proposalsMade = {};
    
    // Initialize proposals made tracking
    this.students.forEach(student => {
      proposalsMade[student.id] = new Set();
    });

    while (freeQueue.length > 0) {
      const personId = freeQueue.shift();
      
      // Find next person to propose to
      const nextTarget = this.reducedLists[personId].find(targetId => 
        !proposalsMade[personId].has(targetId)
      );
      
      if (!nextTarget) {
        // No more people to propose to - algorithm fails
        throw new Error('No stable matching exists');
      }
      
      proposalsMade[personId].add(nextTarget);
      
      // Make proposal
      if (!this.proposals[nextTarget]) {
        // First proposal - accept
        this.proposals[nextTarget] = personId;
        this.suitors[nextTarget].push(personId);
      } else {
        // Compare with current proposal
        const currentProposer = this.proposals[nextTarget];
        
        if (this.ranks[nextTarget][personId] < this.ranks[nextTarget][currentProposer]) {
          // Prefer new proposer - reject current
          this.proposals[nextTarget] = personId;
          this.suitors[nextTarget].push(personId);
          freeQueue.push(currentProposer);
        } else {
          // Prefer current proposer - reject new
          freeQueue.push(personId);
        }
      }
    }
    
    // First reduction
    this.firstReduction();
  }

  // First reduction after proposal phase
  firstReduction() {
    Object.keys(this.proposals).forEach(personId => {
      const proposerId = this.proposals[personId];
      const proposerRank = this.ranks[personId][proposerId];
      
      // Remove everyone ranked lower than the final proposer
      this.reducedLists[personId] = this.reducedLists[personId].filter(otherId => {
        if (this.ranks[personId][otherId] > proposerRank) {
          // Mutual removal
          this.reducedLists[otherId] = this.reducedLists[otherId].filter(id => id !== personId);
          return false;
        }
        return true;
      });
    });
  }

  // Phase 2: Cycle Detection and Elimination
  cycleEliminationPhase() {
    let maxIterations = 1000; // Prevent infinite loops
    
    while (maxIterations-- > 0) {
      // Check if we have a stable matching (symmetric preferences)
      if (this.isStableMatching()) {
        return this.extractMatching();
      }
      
      // Find and eliminate a cycle
      const cycle = this.findCycle();
      if (cycle.length === 0) {
        throw new Error('No stable matching exists');
      }
      
      this.eliminateCycle(cycle);
      this.handleNewProposals();
    }
    
    throw new Error('Algorithm exceeded maximum iterations');
  }

  // Check if current state represents a stable matching
  isStableMatching() {
    return Object.keys(this.reducedLists).every(personId => {
      const topChoice = this.reducedLists[personId][0];
      return topChoice && this.reducedLists[topChoice][0] === personId;
    });
  }

  // Find a cycle in the preference structure
  findCycle() {
    const visited = new Set();
    const path = new Set();
    
    for (const startId of Object.keys(this.reducedLists)) {
      if (visited.has(startId)) continue;
      
      const cycle = this.findCycleFromNode(startId, visited, path, []);
      if (cycle.length > 0) return cycle;
    }
    
    return [];
  }

  findCycleFromNode(nodeId, visited, path, currentPath) {
    if (path.has(nodeId)) {
      // Found cycle
      const cycleStart = currentPath.indexOf(nodeId);
      return currentPath.slice(cycleStart);
    }
    
    if (visited.has(nodeId)) return [];
    
    visited.add(nodeId);
    path.add(nodeId);
    currentPath.push(nodeId);
    
    const topChoice = this.reducedLists[nodeId][0];
    if (topChoice) {
      const cycle = this.findCycleFromNode(topChoice, visited, path, [...currentPath]);
      if (cycle.length > 0) return cycle;
    }
    
    path.delete(nodeId);
    return [];
  }

  // Eliminate a detected cycle
  eliminateCycle(cycle) {
    for (let i = 0; i < cycle.length; i++) {
      const current = cycle[i];
      const next = cycle[(i + 1) % cycle.length];
      const previous = cycle[(i - 1 + cycle.length) % cycle.length];
      
      // Previous rejects current (mutual removal)
      this.reducedLists[previous] = this.reducedLists[previous].filter(id => id !== current);
      this.reducedLists[current] = this.reducedLists[current].filter(id => id !== previous);
    }
  }

  // Handle new proposals after cycle elimination
  handleNewProposals() {
    const needsNewProposal = [];
    
    Object.keys(this.reducedLists).forEach(personId => {
      if (this.reducedLists[personId].length === 0) {
        throw new Error('No stable matching exists');
      }
      
      const topChoice = this.reducedLists[personId][0];
      if (this.proposals[topChoice] !== personId) {
        needsNewProposal.push(personId);
      }
    });
    
    // Make new proposals
    needsNewProposal.forEach(personId => {
      const topChoice = this.reducedLists[personId][0];
      
      if (!this.proposals[topChoice]) {
        this.proposals[topChoice] = personId;
      } else {
        const currentProposer = this.proposals[topChoice];
        if (this.ranks[topChoice][personId] < this.ranks[topChoice][currentProposer]) {
          this.proposals[topChoice] = personId;
        }
      }
    });
  }

  // Extract final matching from the algorithm result
  extractMatching() {
    const matching = [];
    const matched = new Set();
    
    Object.keys(this.reducedLists).forEach(personId => {
      if (matched.has(personId)) return;
      
      const partnerId = this.reducedLists[personId][0];
      if (partnerId && this.reducedLists[partnerId][0] === personId) {
        const person = this.students.find(s => s.id === personId);
        const partner = this.students.find(s => s.id === partnerId);
        
        matching.push({
          person1: person,
          person2: partner,
          compatibilityScore: this.calculateCompatibilityScore(person, partner)
        });
        
        matched.add(personId);
        matched.add(partnerId);
      }
    });
    
    return matching;
  }

  // Run the complete algorithm
  findStableMatching() {
    try {
      this.generatePreferences();
      this.proposalPhase();
      return this.cycleEliminationPhase();
    } catch (error) {
      console.error('Stable roommate matching failed:', error.message);
      return null;
    }
  }

  // Compatibility scoring (simplified version for the algorithm)
  calculateCompatibilityScore(student1, student2) {
    let score = 0;
    let factors = 0;

    // Budget compatibility
    if (student1.budget && student2.budget) {
      const overlap = Math.min(student1.budget.max, student2.budget.max) - 
                     Math.max(student1.budget.min, student2.budget.min);
      if (overlap > 0) {
        const avgRange = ((student1.budget.max - student1.budget.min) + 
                         (student2.budget.max - student2.budget.min)) / 2;
        score += Math.min(1.0, overlap / avgRange) * 30;
      }
      factors += 30;
    }

    // University match
    if (student1.university === student2.university) {
      score += 25;
    }
    factors += 25;

    // Lifestyle compatibility
    if (student1.lifestyle && student2.lifestyle) {
      const lifestyleFactors = ['cleanliness', 'noiseLevels', 'socialPreference', 'studyHabits'];
      let lifestyleScore = 0;
      let lifestyleFactorCount = 0;
      
      lifestyleFactors.forEach(factor => {
        if (student1.lifestyle[factor] && student2.lifestyle[factor]) {
          lifestyleFactorCount++;
          if (student1.lifestyle[factor] === student2.lifestyle[factor]) {
            lifestyleScore += 1;
          }
        }
      });
      
      if (lifestyleFactorCount > 0) {
        score += (lifestyleScore / lifestyleFactorCount) * 20;
      }
      factors += 20;
    }

    // Academic level compatibility
    if (student1.academicLevel === student2.academicLevel) {
      score += 15;
    }
    factors += 15;

    // Age compatibility
    if (student1.age && student2.age) {
      const ageDiff = Math.abs(student1.age - student2.age);
      if (ageDiff <= 2) score += 10;
      else if (ageDiff <= 4) score += 5;
    }
    factors += 10;

    return factors > 0 ? Math.round(score / factors * 100) : 0;
  }
}

// Main function to find stable roommate pairs
export const findStableRoommatePairs = (students) => {
  // Security check
  if (students.some(student => student.userType === 'owner')) {
    throw new Error('Roommate matching is only available for students');
  }

  if (students.length % 2 !== 0) {
    throw new Error('Number of students must be even for roommate pairing');
  }

  const algorithm = new StableRoommatesAlgorithm(students);
  return algorithm.findStableMatching();
};

// Helper function to create groups for lease applications
export const createRoommateGroups = (pairs, maxGroupSize = 4) => {
  const groups = [];
  let currentGroup = [];
  
  pairs.forEach(pair => {
    if (currentGroup.length + 2 <= maxGroupSize) {
      currentGroup.push(pair.person1, pair.person2);
    } else {
      if (currentGroup.length > 0) {
        groups.push({
          id: Math.random().toString(36).substr(2, 9),
          members: [...currentGroup],
          createdAt: new Date().toISOString(),
          status: 'forming'
        });
      }
      currentGroup = [pair.person1, pair.person2];
    }
  });
  
  if (currentGroup.length > 0) {
    groups.push({
      id: Math.random().toString(36).substr(2, 9),
      members: [...currentGroup],
      createdAt: new Date().toISOString(),
      status: 'forming'
    });
  }
  
  return groups;
};