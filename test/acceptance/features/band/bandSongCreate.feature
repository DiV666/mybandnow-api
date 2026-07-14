@band
Feature: Create a song under a band
  In order to manage a band's catalog
  As an authenticated band member
  I want to create a song under a band

  Background:
    Given An "bandId" parameter with value as "string":
    """
    $uuid
    """
    And An "ownerId" parameter with value as "string":
    """
    $uuid
    """
    And An "memberId" parameter with value as "string":
    """
    $uuid
    """
    And A musician exists with id "#ownerId", user id "#ownerId", and username "band-owner"
    And A musician exists with id "#memberId", user id "#memberId", and username "band-member"
    And An existing band with id "#bandId", owner "#ownerId", and member "#memberId"
    And An "id" parameter with value as "string":
    """
    $uuid
    """

  Scenario: A band member can create a valid song
    Given I authenticate as user "band-member" with id "#memberId"
    When I send a POST request to "/v1/bands/#bandId/songs" with body:
      """
      {
        "id": "#id",
        "title": "Road to Green",
        "originalVideoclipUrl": "https://cdn.example.com/road-to-green.mp4"
      }
      """
    Then the response status code should be 201

  Scenario: A musician outside the band cannot create a song
    Given An "outsiderId" parameter with value as "string":
    """
    $uuid
    """
    And A musician exists with id "#outsiderId", user id "#outsiderId", and username "band-outsider"
    And I authenticate as user "band-outsider" with id "#outsiderId"
    When I send a POST request to "/v1/bands/#bandId/songs" with body:
      """
      {
        "id": "#id",
        "title": "Road to Green",
        "originalVideoclipUrl": "https://cdn.example.com/road-to-green.mp4"
      }
      """
    Then the response status code should be 403

  Scenario: bandId in the request body returns 400
    Given I authenticate as user "band-member" with id "#memberId"
    When I send a POST request to "/v1/bands/#bandId/songs" with body:
      """
      {
        "id": "#id",
        "title": "Road to Green",
        "originalVideoclipUrl": "https://cdn.example.com/road-to-green.mp4",
        "bandId": "#bandId"
      }
      """
    Then the response status code should be 400
