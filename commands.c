/**
 * @name        : commands.c
 * @author      : Thomas Gummerer
 * @version     : 0.1
 * @copyright   : Copyright (c) Thomas Gummerer 2010 | All rights reserved.
 * @license     : GPL
 */
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

// For directory functions
#include <sys/types.h>
#include <sys/stat.h>
#include <unistd.h>

#include "commands.h"
#include "parent.h"
#include "def.h"


// Executes internal command, implemented directly in the code
// TODO: get commands out of a array, or a configuration file as in child.c 
// TODO: implement jobs, bg, foreground, cd 
void internal (char command[])
{
    if (strncmp("jobs", command, 4) == 0) {
        // show_proc_list();  
    }

    if (strncmp("bg", command, 2) == 0) {
        background(command);
    }

    if (strncmp("fg", command, 2) == 0) {
        foreground(command);
    }
	
    if (strncmp("in", command, 2) == 0) {
        in(command);
    }

    if (strncmp("out", command, 3) == 0) {
        out(command);
    }
}

// Runs a program in the background, or restarts a already running program in the background.
void background (char command[])
{
    // Run process in background
}

// Restarts a previously paused program in the foreground
void foreground (char command[])
{
    // Run process in foreground
}

// Is called from main.c
void cd (char command[]) 
{
	char * directory;
	char * sep = " \t\n";
	// first part of the command has to be cd
	strtok(command, sep);

	// The first argument is the directory, to which should be changed
	directory = strtok(NULL, sep);
	if (chdir(directory) != 0) {
		perror("Change directory failed.\n");	
	}
}

// Replaces the standard input by a file. Syntax: in <input> <program + parameters>
void in (char command[])
{
    // Redirect stdin (works like <)
    char * file;
    char * sep = " \t\n";
    // Throw the first piece away, its out.
    strtok(command, sep);

    FILE * fp;

    // Second part is the file, from which the inputs should be taken
    file = strtok(NULL, sep);
    if ((fp = freopen (file, "r", stdin)) == NULL) {
        perror("Could not open the specified file\n");
        exit(-1);
    }

    char * element = strtok (NULL, sep);
    int count = 0;
    char * com [MAX_COMMAND_LENGTH];
    while (element != NULL)
    {
        com[count] = element;
        count++;
        com[count] = NULL;
        element = strtok (NULL, sep);
    }

    // Execute command
    execvp (com[0], com);  
    perror("Command was not found");
}

// Redirects the standard output to a file. If the file already exists it will be overwritten. Syntax: out <output file> <program + parameters>
void out (char command[])
{
    char * file;
    char * sep = " \t\n";

    // Throw the first piece away, its out.
    strtok(command, sep);

    // Second part is the file, to which the output should be redirected
    file = strtok(NULL, sep);

    FILE * fp;
    if ((fp = freopen (file, "w", stdout)) == NULL) {
        perror("Could not write to the specified file\n");
        exit (-1);
    }

    char * element = strtok (NULL, sep);
    int count = 0;
    char * com [MAX_COMMAND_LENGTH];
    while (element != NULL)
    {
        com[count] = element;
        count++;
        com[count] = NULL;
        element = strtok (NULL, sep);
    }

    // Execute command
    execvp (com[0], com);  
    perror("Command was not found");
}
