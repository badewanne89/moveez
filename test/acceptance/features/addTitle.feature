Feature: add a title to the movie list (https://github.com/schdief/moveez/issues/1)
    As a user
    I'd like to create a list of the titles of movies to remember which movies I want to watch in future.

    Background:
        Given I open the site "/title"

    Scenario: 
        Given   the title is "Moveez - your online watchlist"
        Then    I expect that element "h1" contains the text "Your watchlist:"