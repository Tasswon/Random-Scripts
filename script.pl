#!/usr/bin/perl -w
use strict;
use warnings;
use File::Copy;

my $filename = '';
my $filename_update;
my $old_name;

#copies name of the current updated file and ensures the directory isn't empty
my $directory = '';
opendir (DIR, $directory) or die $!;
while(my $file = readdir(DIR)) {
	next unless ($file =~ m/\.tmpl$/);
	$filename_update = $file;
}
closedir(DIR);

#if there is a current version then it increments the version in the name
if (not index($filename_update, '')) {
	$filename = $filename_update;
	$old_name = $filename_update;	

	my ($t) = $filename =~ /v([^\.]+)/;

	#increments the values andd converts them back to a string
	my $s = $t + 1;
	$t = "" . $t;
	$filename =~s/$t/$s/g;
}

#perform actual work
open(D1, '<');
open(D2, '>', 'current_version/' . $filename);

while(<D1>) {
	$_ =~ s/<tmpl_var name=date>/TEST1/g;
	$_ =~ s/<tmpl_var name=fname>/TEST2/g;
	$_ =~ s/<tmpl_var name=pdate>/TEST3/g;

	print D2 $_;
}
close(D1);
close(D2);

#move old version into the archive folder
if(not index($old_name, 'climategrids')) {
	move('current_version/'.$old_name, 'archive/'.$old_name);
}

