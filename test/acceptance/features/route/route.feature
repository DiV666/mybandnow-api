@route
Feature: Routes

  Scenario: Attempt to access a non existent url
    When I send a GET request to "/non-existent-url"
    Then the response status code should be 404
