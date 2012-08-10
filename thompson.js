/**
 * Implementation of Thomspon's method for matching regular expressions.
 */
var thompson = (function() {

  function addIfMatches(c, state, next) {
    if (state && state.value === c && next.indexOf(state) === -1) {
      next.push(state);
    }
  }

  function step(c, current, next) {
    current.forEach(function(state) {
      if (state.out1) {
        state.out1.value === 'SPLIT' ?
          step(c, [state.out1], next) :
          addIfMatches(c, state.out1, next);
      }

      if (state.out2) {
        state.out2.value === 'SPLIT' ?
          step(c, [state.out2], next) :
          addIfMatches(c, state.out2, next);
      }
    }, this);
  };

  /**
   * Patches nodes without set output node with specified node.
   * @param {Array} nodes Nodes to patch.
   * @param {Object} node NFA's node.
   */
  function patch(nodes, out) {
    nodes.forEach(function(node) {
      if (node.value === 'SPLIT') {
        node.out2 = out;
      }
      else {
        node.out1 = out;
      }
    });
  }

  /**
   * Creates NFA from regep's AST.
   * @param {Object} ast Regexp's AST.
   * @param {boolean} success Indicates if current AST's node is successful or not.
   * @return {Array} First elemnt is start node of NFA, second is list of nodes without set output node.
   */
  function astToNFA(ast, success) {
      var left, right, node, quantifier;

      switch (ast.type) {
        case re.T_CONCAT:
          left = astToNFA(ast.left, false),
          right = astToNFA(ast.right, success);
          patch(left[1], right[0]);
          return [left[0], right[1]];
        case re.T_CHAR:
          node = { value: ast.value, out1: null };
          success && (node.success = true);
          return [node, [node]];
        case re.T_REPEAT:
          if (ast.quantifier.from === 0 && ast.quantifier.to === 1 && ast.quantifier.special) {
            left = astToNFA(ast.atom, success);

            node = {
              value: 'SPLIT',
              out1: left[0],
              out2: null
            };

            return [node, left[1].concat(node)];
          }
          else {
            throw new Error('Unsupported quantifier', ast.quantifier);
          }
        case re.T_OR:
          left = astToNFA(ast.left, success);
          right = astToNFA(ast.right, success);
          return [
            { value: 'SPLIT', out1: left[0], out2: right[0] },
            left[1].concat(right[1])
          ];
        default:
          throw new Error('Unsupported type', ast.type);
      }
  }

  return {
    /**
     * Converts regular expression's syntax tree to non-deterministic finite automa.
     * @param {Object} ast Regexp's abstract syntax tree.
     * @return {Object} NFA for passed regexp.
     */
    astToNFA: function(ast) {
      return {
        value: 'START',
        out1: astToNFA(ast, true)[0]
      };
    },
    /**
     * Matches specified string against passed regular expression.
     * @param {string} s String to match.
     * @param {string} regexp Regexp's string.
     * @return {boolean} True if match has been found.
     */
    match: function(s, regexp) {
      var current = [this.astToNFA(re.parse(regexp))],
          next = []; 

      for (var i = 0; i < s.length; i++) {
        step(s[i], current, next);
        current = next;
        next = [];
      }

      // Checks if  at least one of current state is successful one.
      return current.some(function(node) { return node.success; });
    }
  };
})();
