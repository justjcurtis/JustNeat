# JustNeat
A js neat library for node & browser.

## Description
JustNeat is a simple configurable javascript neat library for node & browser with phased pruning.

---
### Add to static web project
Add the following script wherever you intent to use neat.
>`<script src="https://cdn.jsdelivr.net/gh/justjcurtis/JustNeat/browserNeat.min.js"></script>`

The `Neat` class will then be available for you to use in your javscript files via either
> `const neat = new Neat($inputCount, $outputCount, $opts?)`

>`const neat = Neat.FromJson($json)`

---

## Todo
-  add unit tests
    - neat

- add documentation
    - neatNode
    - neatConnection
    - neatGenome
    - client
    - neat

---

## References
- [Evolving Neural Networks through Augmenting Topologies - **Kenneth O. Stanley**](http://nn.cs.utexas.edu/downloads/papers/stanley.ec02.pdf)
- [Phased Searching with NEAT:Alternating Between Complexification And Simplification - **Colin D. Green**](https://sharpneat.sourceforge.io/phasedsearch.html)