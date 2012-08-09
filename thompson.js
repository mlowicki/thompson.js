var thompson = (function() {

  function addIfMatches(c, state, next) {
    if (state && state.value === c && next.indexOf(state) === -1) {
      next.push(state);
    }
  }

  function step(c, current, next) {
    current.forEach(function(state) {
      if (thompson.isStart(state)) {
        thompson.isSplit(state.next) ?
          step(c, [state.next], next) :
          addIfMatches(c, state.next, next);
      }
      else if (thompson.isSplit(state)) {
        thompson.isSplit(state.left) ?
          step(c, [state.left], next) :
          addIfMatches(c, state.left, next);

        thompson.isSplit(state.right) ?
          step(c, [state.right], next) :
          addIfMatches(c, state.right, next);
      }
      else {
        addIfMatches(c, state.next, next);
      }
    }, this);
  };

  function astToNFA(ast, success) {
      var left, right;

      switch (ast.type) {
        case re.T_CONCAT:
          left = astToNFA(ast.left, false),
          right = astToNFA(ast.right, success);

          left.next = right;
          return left;
        case re.T_CHAR:
          return { value: ast.value, next: null, success: success };
        case re.T_OR:
          left = astToNFA(ast.left, success),
          right = astToNFA(ast.right, success);

          return {
            value: 'split', 
            left: left,
            right: right
          };
        default:
          throw new Error('Unrecognized type: ' + ast.type);
      }
  }

  return {
    /**
     * @param {Object} state NFA's state.
     * @return {boolean} True if state is of type 'start'.
     */
    isStart: function(state) {
      return state.value === 'start';
    },
    /**
     * @param {Object} state NFA's state.
     * @return {boolean} True if state is of type 'split'.
     */
    isSplit: function(state) {
      return state.value === 'split';
    },
    /**
     * Converts regular expression's syntax tree to non-deterministic finite automa.
     * @param {Object} ast Regexp's abstract syntax tree.
     * @return {Object} NFA for passed regexp.
     */
    astToNFA: function(ast) {
      return {
        value: 'start',
        next: astToNFA(ast, true),
        success: false
      };
    },
    /**
     * @param {string} s String to match.
     * @param {Object} nfa NFA used to match string.
     * @return {boolean} True if match has been found.
     */
    match: function(s, nfa) {
      var current = [nfa],
          next = []; 

      for (var i = 0; i < s.length; i++) {
        step(s[i], current, next);
        current = next;
        next = [];
      }

      return current.some(function(node) { return node.success; });
    }
  };
})();
