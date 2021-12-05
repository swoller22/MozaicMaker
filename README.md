# MozaicMaker

This full-stack project was developed by Stephen Woller for BU MET 602: Server-side Development and BU MET 664: Artificial Intelligence in the Fall 2021 Semester.

## Project Description

The purpose of this project was to create a website that allows users to input a large image and a set of images, such that the set of images is used
to recreate a mozaic of the large image. An example is shown below.

//Insert image here

There are three mozaic creation algorithms currently implemented: Brute Force Search, Hill Climbing over an RGB-Sorted Colorspace, and Hill Climbing over an HSV-Sorted Colorspace. Each of these algorithms involve the following steps:
 1. Breaking the large image down into blocks based on the small image size
 2. Search through the input image set for the best match to each block, defined as having the minimum color distance to that block
 3. Create the large image mozaic by joining resized variants of the best matches

The point of variation across the 3 algorithms is step 2, searching for the best match for each block.

### Brute Force Search

The Brute Force Search algorithm searches the entire input image set to find the minimum color distance. While this will always find the optimal solution, the time complexity is prohibitive as the number of blocks and input image set size increases. The algorithm runs in O(r*c*n) time where r is the number of rows of blocks, c is the number of columns of blocks, and n is the input image set size.

To address the time complexity concerns, 2 new algorithms were investigated and generated: Hill Climbing over an RGB-Sorted Colorspace and Hill Climbing over an HSV-Sorted Colorspace.

### Hill Climbing over an RGB-Sorted Colorspace

### Hill Climbing over an HSV-Sorted Colorspace

## How To Run

sfsdffg

## Design

### Technology stack

### Top-Level Design

### Client-Side Design

#### User Experience

### Server-Side Design

#### Database Design

### Security Considerations

## Limitations and Future Considerations
