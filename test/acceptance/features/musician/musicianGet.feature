@musician
Feature: Get public musician profile

  Scenario: A valid public profile is returned
    Given A musician exists with id "4892c949-0638-4e1b-b461-71fbdb36c1e1", user id "5552c949-0638-4e1b-b461-71fbdb36c1e1", and username "public_musician"
    When I send a GET request to "/v1/musicians/4892c949-0638-4e1b-b461-71fbdb36c1e1"
    Then the response status code should be 200
    And the response should be:
      """
      {
        "id": "4892c949-0638-4e1b-b461-71fbdb36c1e1",
        "name": "public_musician",
        "username": "public_musician"
      }
      """

  Scenario: Attempting to get a non-existent musician returns 404
    When I send a GET request to "/v1/musicians/9992c949-0638-4e1b-b461-71fbdb36c1e9"
    Then the response status code should be 404
