// Sorting Widget
// original author: Ian Leow Tze Wei
class Sorting {
	constructor() {
		//Hoang
		const HIGHLIGHT_NONE = "#cda466"; //5a959a cda466 dfc7c1
		const HIGHLIGHT_STANDARD = "#DC143C";
		const HIGHLIGHT_SPECIAL = "rgb(255, 252, 49)";
		const HIGHLIGHT_SORTED = "#52bc69";
		// constants
		// const HIGHLIGHT_NONE = "lightblue";
		// const HIGHLIGHT_STANDARD = "green"; //bubbleSort selectionSort insertionSort
		// const HIGHLIGHT_SPECIAL = "#DC143C";//selectionSort insertionSort
		// const HIGHLIGHT_SORTED = "orange";  //bubbleSort selectionSort insertionSort

		const POSITION_USE_PRIMARY = "a";
		const POSITION_USE_SECONDARY_IN_DEFAULT_POSITION = "b";

		// Objects definition
		var Entry = function (value, highlight, position, secondaryPositionStatus) {
			this.value = value; // number
			this.highlight = highlight; // string, use HIGHLIGHT_ constants
			this.position = position; // number
			this.secondaryPositionStatus = secondaryPositionStatus; // integer, +ve for position overwrite, -ve for absolute postion (-1 for 0th absolution position)
		};

		var Backlink = function (value, highlight, entryPosition, secondaryPositionStatus) {
			this.value = value; // number
			this.highlight = highlight; // string, use HIGHLIGHT_ constants
			this.entryPosition = entryPosition; // number
			this.secondaryPositionStatus = secondaryPositionStatus; // integer, +ve for position overwrite
		};

		var State = function (entries, backlinks, barsCountOffset, status, lineNo) {
			this.entries = entries; // array of Entry's
			this.backlinks = backlinks; // array of Backlink's
			this.barsCountOffset = barsCountOffset; // how many bars to "disregard" (+ve) or to "imagine" (-ve) w.r.t. state.entries.length when calculating the centre position
			this.status = status;
			this.lineNo = lineNo; //integer or array, line of the code to highlight
		};

		//Helpers
		var EntryBacklinkHelper = new Object();
		EntryBacklinkHelper.appendList = function (entries, backlinks, numArray) {
			for (var i = 0; i < numArray.length; i++) {
				EntryBacklinkHelper.append(entries, backlinks, numArray[i]);
			}
		};

		EntryBacklinkHelper.append = function (entries, backlinks, newNumber) {
			entries.push(new Entry(newNumber, HIGHLIGHT_NONE, entries.length, POSITION_USE_PRIMARY));
			backlinks.push(new Backlink(newNumber, HIGHLIGHT_NONE, backlinks.length, POSITION_USE_PRIMARY));
		};

		EntryBacklinkHelper.update = function (entries, backlinks) {
			for (var i = 0; i < backlinks.length; i++) {
				entries[backlinks[i].entryPosition].highlight = backlinks[i].highlight;
				entries[backlinks[i].entryPosition].position = i;
				entries[backlinks[i].entryPosition].secondaryPositionStatus = backlinks[i].secondaryPositionStatus;
			}
		};

		EntryBacklinkHelper.copyEntry = function (oldEntry) {
			return new Entry(oldEntry.value, oldEntry.highlight, oldEntry.position, oldEntry.secondaryPositionStatus);
		};

		EntryBacklinkHelper.copyBacklink = function (oldBacklink) {
			return new Backlink(oldBacklink.value, oldBacklink.highlight, oldBacklink.entryPosition, oldBacklink.secondaryPositionStatus);
		};

		EntryBacklinkHelper.swapBacklinks = function (backlinks, i, j) {
			var swaptemp = backlinks[i];
			backlinks[i] = backlinks[j];
			backlinks[j] = swaptemp;
		};

		var StateHelper = new Object();
		StateHelper.createNewState = function (numArray) {
			var entries = new Array();
			var backlinks = new Array();
			EntryBacklinkHelper.appendList(entries, backlinks, numArray);
			return new State(entries, backlinks, 0, "", 0);
		};

		StateHelper.copyState = function (oldState) {
			var newEntries = new Array();
			var newBacklinks = new Array();
			for (var i = 0; i < oldState.backlinks.length; i++) {
				newEntries.push(EntryBacklinkHelper.copyEntry(oldState.entries[i]));
				newBacklinks.push(EntryBacklinkHelper.copyBacklink(oldState.backlinks[i]));
			}

			var newLineNo = oldState.lineNo;
			if (newLineNo instanceof Array)
				newLineNo = oldState.lineNo.slice();

			return new State(newEntries, newBacklinks, oldState.barsCountOffset, oldState.status, newLineNo);
		};

		StateHelper.updateCopyPush = function (list, stateToPush) {
			EntryBacklinkHelper.update(stateToPush.entries, stateToPush.backlinks);
			list.push(StateHelper.copyState(stateToPush));
		};

		var FunctionList = new Object();
		FunctionList.text_y = function (d) {
			var barHeight = scaler(d.value);
			if (barHeight < 32)
				return -15;
			return barHeight - 15;
		};

		FunctionList.g_transform = function (d) {
			if (d.secondaryPositionStatus == POSITION_USE_PRIMARY)
				return 'translate(' + (centreBarsOffset + d.position * barWidth) + ", " + (maxHeight - scaler(d.value)) + ')';
			else if (d.secondaryPositionStatus == POSITION_USE_SECONDARY_IN_DEFAULT_POSITION)
				return 'translate(' + (centreBarsOffset + d.position * barWidth) + ", " + (maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows - scaler(d.value)) + ')';
			else if (d.secondaryPositionStatus >= 0)
				return 'translate(' + (centreBarsOffset + d.secondaryPositionStatus * barWidth) + ", " + (maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows - scaler(d.value)) + ')';
			else if (d.secondaryPositionStatus < 0)
				return 'translate(' + ((d.secondaryPositionStatus * -1 - 1) * barWidth) + ", " + (maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows - scaler(d.value)) + ')';

			else
				return 'translation(0, 0)'; // error
		};

		// Variables/Settings
		this.currentNumList = [97, 73, 45, 29, 17, 57, 5, 9, 65, 49, 37, 81, 53, 13, 89, 21, 85, 1, 41, 93, 69, 61, 77, 33, 25]; // the default

		var barWidth = 35;
		var maxHeight = 230;
		var gapBetweenBars = 1;
		var maxNumOfElements = 25;
		var gapBetweenPrimaryAndSecondaryRows = 10;

		var maxElementValue = 99;


		//Code body
		var statelist = new Array();
		var secondaryStatelist = new Array();
		var transitionTime = 300;
		var currentStep = 0;
		var animInterval;
		var isPlaying; //so named so as not to mess with the isPlaying in viz.js

		var centreBarsOffset; // x offset to centre the bars in the canvas

		var isCountingSort = false;

		this.selectedSortFunction;
		// this.useEnhancedBubbleSort = false;
		this.computeInversionIndex = false;

		var canvas = d3.select("#viz-canvas")
			.attr("height", maxHeight * 2 + gapBetweenPrimaryAndSecondaryRows)
			.attr("width", barWidth * maxNumOfElements);

		var countingSortSecondaryCanvas = d3.select("#viz-counting-sort-secondary-canvas")
			.attr("height", 60)
			.attr("width", barWidth * maxNumOfElements);


		var scaler = d3.scale
			.linear()
			.range([0, maxHeight]);

		var drawState = function (stateIndex) {
			drawBars(statelist[stateIndex]);
			$('#status p').html(statelist[stateIndex].status);
			highlightLine(statelist[stateIndex].lineNo);

			if (isCountingSort)
				drawCountingSortCounters(secondaryStatelist[stateIndex]);
		};

		var drawBars = function (state) {
			scaler.domain([0, d3.max(state.entries, function (d) {
				return d.value;
			})]);

			centreBarsOffset = (maxNumOfElements - (state.entries.length - state.barsCountOffset)) * barWidth / 2;

			var canvasData = canvas.selectAll("g").data(state.entries);

			// Exit ==============================
			var exitData = canvasData.exit()
				.remove();

			// Entry ==============================
			var newData = canvasData.enter()
				.append("g")
				.attr("transform", FunctionList.g_transform);

			newData.append("rect")
				.attr("height", 0)
				.attr("width", 0);

			newData.append("text")
				.attr("dy", ".35em")
				.attr("x", (barWidth - gapBetweenBars) / 2)
				.attr("y", FunctionList.text_y)
				.text(function (d) {
					return d.value;
				});

			// Update ==============================
			canvasData.select("text")
				.transition()
				.attr("y", FunctionList.text_y)
				.text(function (d) {
					return d.value;
				});

			canvasData.select("rect")
				.transition()
				.attr("height", function (d) {
					return scaler(d.value);
				})
				.attr("width", barWidth - gapBetweenBars)
				.style("fill", function (d) {
					return d.highlight;
				});

			canvasData.transition()
				.attr("transform", FunctionList.g_transform);
		};

		var drawCountingSortCounters = function (state) {
			var canvasData;
			if (state == null)
				canvasData = countingSortSecondaryCanvas.selectAll("text").data([]);

			else
				canvasData = countingSortSecondaryCanvas.selectAll("text").data(state);

			// Exit ==============================
			var exitData = canvasData
				.exit()
				.remove();

			// Entry ==============================
			var newData = canvasData
				.enter()
				.append("text")
				.attr("dy", ".35em")
				.attr("x", function (d, i) {
					return (i + 5) * barWidth + (barWidth - gapBetweenBars) / 2;
				})
				.attr("y", 20)
				.text(function (d) {
					return d;
				});

			// Update ==============================
			canvasData
				.transition()
				.text(function (d) {
					return d;
				});
		};

		var generateRandomNumberArray = function (size, limit) {
			var numArray = [];
			for (var i = 0; i < size; i++) {
				numArray.push(generateRandomNumber(1, limit));
			}
			return numArray;
		};

		var generateRandomNumber = function (min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		};

		var convertToNumber = function (num) {
			return +num;
		};

		this.createList = function (type) {
			var numArrayMaxListSize = 25;
			var numArrayMaxElementValue = maxElementValue;
			if (this.selectedSortFunction == this.radixSort) {
				numArrayMaxListSize = 15;
				numArrayMaxElementValue = maxRadixSortElementValue;
			} else if (this.selectedSortFunction == this.countingSort) {
				numArrayMaxElementValue = maxCountingSortElementValue;
			}

			var numArray = generateRandomNumberArray(generateRandomNumber(10, numArrayMaxListSize), numArrayMaxElementValue);

			switch (type) {
				case 'userdefined':
					numArray = $('#userdefined-input').val().split(",");

					if (numArray.length > numArrayMaxListSize) {
						alert(`${numArrayMaxListSize} character limit!`);
						return false;
					}

					for (var i = 0; i < numArray.length; i++) {
						var temp = convertToNumber(numArray[i]);

						if (numArray[i].trim() == "") {
							alert('Vui long nhap chinh xac. Cac phan tu ngan cach nhau bang dau " , "');
							return false;
						}
						if (isNaN(temp)) {
							alert(`${numArray[i]} is not a number.`);
							return false;
						}
						if (temp < 1 || temp > numArrayMaxElementValue) {
							alert(`${numArray[i]} is out of range (1-${numArrayMaxElementValue})`)
							return false;
						}

						numArray[i] = convertToNumber(numArray[i]);
					}
					break;
				case 'random':
					break;
			}

			this.loadNumberList(numArray);
		};

		this.loadNumberList = function (numArray) {
			isPlaying = false;
			currentStep = 0;
			this.currentNumList = numArray;
			statelist = [StateHelper.createNewState(numArray)];
			secondaryStatelist = [null]; // the initial secondary state will be an empty state
			drawState(0);
		};

		this.setSelectedSortFunction = function (f) {
			this.selectedSortFunction = f;
			isCountingSort = (this.selectedSortFunction == this.countingSort);
		};

		this.sort = function (callback) {
			isPlaying = true;
			isPaused = false;

			return this.selectedSortFunction(callback);
		};

		this.insertionSort = function (callback) {
			var numElements = statelist[0].backlinks.length;
			var state = StateHelper.copyState(statelist[0]);

			populatePseudocode([
				'sortedList = unsortedList[0]',
				'for <b class="text-danger">Number</b> in  unsortedList',
				'    &#39;extract&#39; <b class="text-danger">Number</b>',
				'    for j = sortedList.length down to 0',
				'        if sortedList[j] &gt; <b class="text-danger">Number</b>',
				'            move sortedList[j] to the right by 1',
				'        break loop and insert <b class="text-danger">Number</b> here'
			]);

			// First element always sorted
			state.lineNo = 1;
			// Mark the first element ({firstVal}) as sorted.
			state.status = `Mark the first element <b class="text-danger">${state.backlinks[0].value}</b> as sorted.`;
			state.backlinks[0].highlight = HIGHLIGHT_SORTED;
			StateHelper.updateCopyPush(statelist, state);

			for (var i = 1; i < numElements; i++) {
				// Highlight first unsorted element
				state.lineNo = [2, 3];
				// Extract the first unsorted element ({val}).
				state.status = `Extract the first unsorted element <b class="text-danger">${state.backlinks[i].value}</b>.`;
				state.backlinks[i].highlight = HIGHLIGHT_SPECIAL;
				state.backlinks[i].secondaryPositionStatus = POSITION_USE_SECONDARY_IN_DEFAULT_POSITION;
				StateHelper.updateCopyPush(statelist, state);

				for (var j = i - 1; j >= 0; j--) {
					state.lineNo = 4;
					// Figure where to insert extracted element.
					// Comparing with sorted element {val}.
					state.status = `Figure where to insert extracted element; comparing with sorted element <b class="text-danger">${state.backlinks[j].value}</b>.`;
					state.backlinks[j].highlight = HIGHLIGHT_STANDARD;
					StateHelper.updateCopyPush(statelist, state);

					if (state.backlinks[j].value > state.backlinks[j + 1].value) {
						state.lineNo = [5, 6];
						// {val1} > {val2} is true.
						// Hence move current sorted element ({val1}) to the right by 1.
						state.status = `<b class="text-danger">${state.backlinks[j].value}</b> > <b class="text-danger">${state.backlinks[j + 1].value}</b> is true, hence move current sorted element <b class="text-danger">${state.backlinks[j].value}</b> to the right by 1.`;
						EntryBacklinkHelper.swapBacklinks(state.backlinks, j, j + 1);
						StateHelper.updateCopyPush(statelist, state);
						state.backlinks[j + 1].highlight = HIGHLIGHT_SORTED;
					} else {
						state.lineNo = 7;
						// {val1} > {val2} is false.
						// Insert extracted element at current position.
						state.status = `${state.backlinks[j].value} > ${state.backlinks[j].value} is false, insert element at current position.`;
						state.backlinks[j].highlight = HIGHLIGHT_SORTED;
						state.backlinks[j + 1].secondaryPositionStatus = POSITION_USE_PRIMARY;
						state.backlinks[j + 1].highlight = HIGHLIGHT_SORTED;
						StateHelper.updateCopyPush(statelist, state);
						break;
					}
				}

				if (state.backlinks[0].secondaryPositionStatus == POSITION_USE_SECONDARY_IN_DEFAULT_POSITION) {
					state.lineNo = 4;
					// At beginning of array (nothing to compare).
					// Hence insert extracted element at current position.
					state.status = 'At beginning of array (nothing to compare), hence insert element at current position.';
					state.backlinks[0].secondaryPositionStatus = POSITION_USE_PRIMARY;
					state.backlinks[0].highlight = HIGHLIGHT_SORTED;
					StateHelper.updateCopyPush(statelist, state);
				}
			}

			for (var i = 0; i < numElements; i++)
				state.backlinks[i].highlight = HIGHLIGHT_NONE; //unhighlight everything
			state.lineNo = 0;
			// The array/list is now sorted.
			state.status = 'List is sorted!';
			StateHelper.updateCopyPush(statelist, state);

			this.play(callback);
			return true;
		};

		this.selectionSort = function (callback) {
			var numElements = statelist[0].backlinks.length;
			var state = StateHelper.copyState(statelist[0]);
			populatePseudocode([
				`for 0 => ${DEFAULT_DATA.length - 1}:`,
				'    currentMinimum =  unsortedList[0]',
				'    for element in unsortedList',
				'        if element < currentMinimum',
				'            currentMinimum = element',
				'    swap(currentMinimum, unsortedList[0])'
			]);
			for (var i = 0; i < numElements - 1; i++) {
				var minPosition = i;

				// Iteration {iteration}: Set {val} as the current minimum.
				// Then iterate through the rest to find the true minimum.
				state.status = `Iteration <b class="text-danger">${i + 1}</b>: Set <b class="text-danger">${state.backlinks[i].value}</b> as the current minimum, then iterate through the remaining unsorted elements to find the true minimum.`;
				state.lineNo = [1, 2, 3];
				state.backlinks[minPosition].highlight = HIGHLIGHT_SPECIAL;

				StateHelper.updateCopyPush(statelist, state);

				for (var j = i + 1; j < numElements; j++) {
					// Check if {val} is smaller than the current minimum ({minVal}).
					state.status = `Check if <b class="text-danger">${state.backlinks[j].value}</b> is smaller than the current minimum <b class="text-danger">${state.backlinks[minPosition].value}</b>.`;
					state.lineNo = 4;
					state.backlinks[j].highlight = HIGHLIGHT_STANDARD;
					StateHelper.updateCopyPush(statelist, state);

					state.backlinks[j].highlight = HIGHLIGHT_NONE;

					if (state.backlinks[j].value < state.backlinks[minPosition].value) {
						state.status = `Set <b class="text-danger">${state.backlinks[j].value}</b> as the new minimum.`;
						state.lineNo = 5;
						state.backlinks[minPosition].highlight = HIGHLIGHT_NONE;
						state.backlinks[j].highlight = HIGHLIGHT_SPECIAL;

						minPosition = j;
						StateHelper.updateCopyPush(statelist, state);
					}
				}

				if (minPosition != i) { // Highlight the first-most unswapped position, if it isn't the minimum
					// Set {val} as the new minimum.
					state.status = `Swap the minimum <b class="text-danger">${state.backlinks[minPosition].value}</b> with the first unsorted element <b class="text-danger">${state.backlinks[i].value}</b>.`;
					state.lineNo = 6;
					state.backlinks[i].highlight = HIGHLIGHT_SPECIAL;
					StateHelper.updateCopyPush(statelist, state);

					EntryBacklinkHelper.swapBacklinks(state.backlinks, minPosition, i);
					StateHelper.updateCopyPush(statelist, state);
				} else {
					// As the minimum is the first unsorted element, no swap is necessary.
					state.status = 'As the minimum is the first unsorted element, no swap is necessary.';
					state.lineNo = 6;
					StateHelper.updateCopyPush(statelist, state);
				}

				// {val} is now considered sorted.
				state.status = `<b class="text-danger">${state.backlinks[i].value}</b> is now considered sorted.`;
				state.backlinks[minPosition].highlight = HIGHLIGHT_NONE;
				state.backlinks[i].highlight = HIGHLIGHT_SORTED;
				StateHelper.updateCopyPush(statelist, state);
			}

			for (var i = 0; i < numElements; i++)
				state.backlinks[i].highlight = HIGHLIGHT_NONE; // un-highlight everything


			// The array/list is now sorted.
			// (After all iterations, the last element will naturally be sorted.)
			state.status = 'List is sorted!' + '<br>' + '(After all iterations, the last element will naturally be sorted.)';
			state.lineNo = 0;
			StateHelper.updateCopyPush(statelist, state);

			this.play(callback);
			return true;
		};

		this.bubbleSort = function (callback) {
			var numElements = statelist[0].backlinks.length;
			var state = StateHelper.copyState(statelist[0]);
			var swapCounter = 0;

			populatePseudocode([
				'do {',
				'    <b class="text-danger">isSwapped </b>= false;',
				'    for (1 => indexOfLastUnsortedElement-1) {',
				'        if leftElement > rightElement',
				'            swap(leftElement, rightElement)',
				'            <b class="text-danger">isSwapped </b>= true' + ((this.computeInversionIndex) ? '; <b class="text-danger">swapCounter</b>++' : "") + ';',
				'}while <b class="text-danger">isSwapped</b>;'
			]);

			var swapped;
			var indexOfLastUnsortedElement = numElements;
			do {
				swapped = false;

				// Set the swapped flag to false.
				// Then iterate from 1 to {endIdx} inclusive.
				state.status = `Set the <b class="text-danger">swapped </b>flag to false.<div>Then iterate from index 1 to <b class="text-danger">${indexOfLastUnsortedElement - 1}</b> inclusive.</div>`;
				state.lineNo = [2, 3];
				StateHelper.updateCopyPush(statelist, state);

				for (var i = 1; i < indexOfLastUnsortedElement; i++) {
					state.backlinks[i - 1].highlight = HIGHLIGHT_STANDARD;
					state.backlinks[i].highlight = HIGHLIGHT_STANDARD;

					// Checking if {val1} > {val2} and swap them if that is true.
					// The current value of swapped = {swapped}.
					state.status = `<div>Checking if <b class='text-danger'>${state.backlinks[i - 1].value}</b> &gt; <b class='text-danger'>${state.backlinks[i].value}</b> and swap them if that is true.</div>The current value of <b class="text-danger">swapped </b>= <b class="text-danger">${swapped}</b>.`;
					state.lineNo = 4;
					StateHelper.updateCopyPush(statelist, state);

					if (state.backlinks[i - 1].value > state.backlinks[i].value) {
						swapped = true;

						// Swapping the positions of {val1} and {val2}.
						// Set swapped = true.
						state.status = `Swapping the positions of <b class='text-danger'>${state.backlinks[i - 1].value}</b> and <b class='text-danger'>${state.backlinks[i].value}</b>.<div>Set <b class='text-danger'>swapped </b>= true.</div>`;
						if (this.computeInversionIndex) {
							swapCounter++;
							// For inversion index computation: Add 1 to swapCounter.
							// The current value of swapCounter = {swapCounter}.
							state.status += ` For inversion index: Add 1 to <b class="text-danger">swapCounter</b>, now = <b class="text-danger">${swapCounter}</b>.`;
						}

						state.lineNo = [5, 6];

						EntryBacklinkHelper.swapBacklinks(state.backlinks, i, i - 1);
						StateHelper.updateCopyPush(statelist, state);
					}

					state.backlinks[i - 1].highlight = HIGHLIGHT_NONE;
					state.backlinks[i].highlight = HIGHLIGHT_NONE;
				}

				indexOfLastUnsortedElement--;
				state.backlinks[indexOfLastUnsortedElement].highlight = HIGHLIGHT_SORTED;
				if (swapped == false)
					// No swap is done in this pass.
					// We can terminate Bubble Sort now.
					state.status = 'No swap is done in this pass.<div>We can terminate Bubble Sort now</div>';

				else
					// Mark last unsorted element as sorted now.
					// As at least one swap is done in this pass, we continue.
					state.status = '<div>Mark this element as sorted now.</div><div>As at least one swap is done in this pass, we continue.</div>';

				state.lineNo = 7;
				StateHelper.updateCopyPush(statelist, state);
			}
			while (swapped);

			for (var i = 0; i < numElements; i++)
				state.backlinks[i].highlight = HIGHLIGHT_NONE; //un-highlight everything


			// The array/list is now sorted.
			state.status = 'List is sorted!';
			if (this.computeInversionIndex)
				// Inversion Index = {swapCounter}.
				state.status += ` Inversion Index = <b class="text-danger">${swapCounter}</b>.`;

			state.lineNo = 0;
			StateHelper.updateCopyPush(statelist, state);

			this.play(callback);
			return true;
		};

		this.interchangeSort = function (callback) {
			let i;
			var numElements = statelist[0].backlinks.length;
			var state = StateHelper.copyState(statelist[0]);
			var swapCounter = 0;

			populatePseudocode([
				`for <b class="text-danger">index</b> => ${DEFAULT_DATA.length - 1}:`,
				`   for <b class="text-danger">index+1</b> in ${DEFAULT_DATA.length - 1}:`,
				'        if list[<b class="text-danger">index</b>] > list[<b class="text-danger">index+1</b>]',
				'           swap(list[<b class="text-danger">index</b>], list[<b class="text-danger">index+1</b>])',
			]);

			for (i = 0; i < numElements; i++) {
				state.backlinks[i].highlight = HIGHLIGHT_STANDARD;
				state.lineNo = 1
				StateHelper.updateCopyPush(statelist, state);
				for (let j = i + 1; j < numElements; j++) {
					state.lineNo = [2, 3]
					state.backlinks[j].highlight = HIGHLIGHT_STANDARD;
					StateHelper.updateCopyPush(statelist, state);
					if (state.backlinks[j].value < state.backlinks[i].value) {
						state.lineNo = [4]
						state.status = `Swapping the positions of <b class='text-danger'>${state.backlinks[j].value}</b> and <b class='text-danger'>${state.backlinks[i].value}</b>.`;
						EntryBacklinkHelper.swapBacklinks(state.backlinks, i, j);
						StateHelper.updateCopyPush(statelist, state);
					}

					state.backlinks[j].highlight = HIGHLIGHT_NONE;
				}

				state.backlinks[i].highlight = HIGHLIGHT_SORTED;
			}


			for (i = 0; i < numElements; i++)
				state.backlinks[i].highlight = HIGHLIGHT_NONE; //un-highlight everything

			// The array/list is now sorted.
			state.status = 'List is sorted!';
			if (this.computeInversionIndex)
				// Inversion Index = {swapCounter}.
				state.status += ` Inversion Index = <b class="text-danger">${swapCounter}</b>.`;

			state.lineNo = 0;
			StateHelper.updateCopyPush(statelist, state);

			this.play(callback);
			return true;
		};

		this.clearPseudocode = function () {
			populatePseudocode([]);
		};

		var populatePseudocode = function (code) {
			var i = 1;
			for (; i <= 7 && i <= code.length; i++) {
				$("#code" + i).html(
					code[i - 1].replace(
						/^\s+/,
						function (m) {
							return m.replace(/\s/g, "&nbsp;");
						}
					)
				);
			}
			for (; i <= 7; i++) {
				$("#code" + i).html("");
			}
		};

		//animation functions
		var drawCurrentState = function () {
			drawState(currentStep);
			if (currentStep == (statelist.length - 1)) { //Neu dang o buoc cuoi
				pause(); //in html file
				$('#play img').attr('src', './image/Restart.png').attr('title', 'replay');
			} else if (!isPlaying || isPaused) //Neu dang o buoc dau tien va isPaused true
			{
				$('#play img').attr('src', './image/Play.png').attr('title', 'play');
				$('#play').css('display', 'block');
				$('#pause').css('display', 'none');
			}
			else if (!isPaused || isPlaying) // isPlaying
			{
				$('#pause').css('display', 'block');
				$('#play').css('display', 'none');
			}
		};

		this.getAnimationDuration = function () {
			return transitionTime;
		};

		this.setAnimationDuration = function (x) {
			transitionTime = x;
			if (isPlaying) {
				clearInterval(animInterval);
				animInterval = setInterval(function () {
					drawCurrentState();
					if (currentStep < (statelist.length - 1))
						currentStep++;

					else
						clearInterval(animInterval);
				}, transitionTime);
			}
		};

		this.getCurrentIteration = function () {
			return currentStep;
		};

		this.getTotalIteration = function () {
			return statelist.length;
		};

		this.forceNext = function () {
			if ((currentStep + 1) < statelist.length)
				currentStep++;
			drawCurrentState();
		};

		this.forcePrevious = function () {
			if ((currentStep - 1) >= 0)
				currentStep--;
			drawCurrentState();
		};

		this.jumpToIteration = function (n) {
			currentStep = n;
			drawCurrentState();
		};

		this.play = function (callback) {
			isPlaying = true;
			drawCurrentState();
			animInterval = setInterval(function () {
				drawCurrentState();
				if (currentStep < (statelist.length - 1))
					currentStep++;
				else {
					clearInterval(animInterval);
					if (typeof callback == 'function')
						callback();
				}
			}, transitionTime);
		};

		this.pause = function () {
			isPlaying = false;
			$('#play img').attr('src', './image/Play.png').attr('title', 'play');
			clearInterval(animInterval);
		};

		this.replay = function () {
			isPlaying = true;
			currentStep = 0;
			drawCurrentState();
			animInterval = setInterval(function () {
				drawCurrentState();
				if (currentStep < (statelist.length - 1))
					currentStep++;

				else
					clearInterval(animInterval);
			}, transitionTime);
		};

		this.stop = function () {
			isPlaying = false;
			statelist = [statelist[0]]; //clear statelist to original state, instead of new Array();
			secondaryStatelist = [null];
			currentStep = 0;
			drawState(0);
		};
	}
}

//Hoang

const DEFAULT_DATA = [97, 73, 45, 29, 17, 57, 5, 9, 65, 49, 37, 81, 53, 13, 89, 21, 85, 1, 41, 93, 69, 61, 77, 33, 25];

var gw = new Sorting();

let sortSelection = (sortName) => {
	showStandardCanvas();
	switch (sortName) {
		case 'bubble':
			document.getElementById("title-header").innerHTML = "Bubble Sort";
			changeSortType(gw.bubbleSort);
			break;
		case 'selection':
			document.getElementById("title-header").innerHTML = "Selection Sort";
			changeSortType(gw.selectionSort);
			break;
		case 'insertion':
			document.getElementById("title-header").innerHTML = "Insertion Sort";
			changeSortType(gw.insertionSort);
			break;
		case 'interchange':
			document.getElementById("title-header").innerHTML = "Interchange Sort";
			changeSortType(gw.interchangeSort);
			break;
		default:
			document.getElementById("title-header").innerHTML = "Linked List";
			break;
	}
}


$("#sort_algo").on("change", function (e) {
	if (e.target.value === "linked-list") {
		$("#sort-viz").css({ display: "none" })
		$("#linked-list").css({ display: "block", maxHeight: "500px" })
	} else {
		$("#linked-list").css({ display: "none" })
		$("#sort-viz").css({ display: "block" })
		sortSelection(e.target.value)
	}
})

$(function () {
	changeSortType(gw.bubbleSort);
});

function changeSortType(newSortingFunction, customNumberList) {
	$('#userdefined-input').val(customNumberList || DEFAULT_DATA.join(", "));
	createList('userdefined');

	if (isPlaying) stop();

	gw.clearPseudocode();
	gw.setSelectedSortFunction(newSortingFunction);
}
$("#data_type").on('change', (e) => {
	if (e.target.value == "random") {
		createList("random");
		$(".manual-data").css({ display: "none" })
	}
	else {
		$(".manual-data").css({ display: "block" })
	}
});

$("#random_data").on('click', (e) => {
	console.log("abck")
	createList("random");
});

function createList(type) {
	if (isPlaying) stop();
	setTimeout(function () {
		if (gw.createList(type)) {
			closeCreate();
			isPlaying = false;
		}
	}, 300);
}

function sort(callback) {
	if (isPlaying && confirm("The sort is running. Do you want the new sort?"))
		stop();
	if (!isPlaying)
		setTimeout(function () {
			gw.setAnimationDuration(3200 - parseInt($("#speedSort").val()));
			if (gw.sort(callback))
				isPlaying = true;
		}, 300);
}


function showStandardCanvas() {
	$("#viz-canvas").show();
}